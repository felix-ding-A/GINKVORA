import React, { useCallback, useRef, useState } from 'react'
import { TextArea, Card, Text, Flex, Stack, Button } from '@sanity/ui'
import { set, unset, useClient } from 'sanity'

export function CustomMarkdownInput(props: any) {
  const { value = '', onChange, elementProps, schemaType } = props
  const client = useClient({ apiVersion: '2023-01-01' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue ? set(nextValue) : unset())
    },
    [onChange]
  )

  const insertAtCursor = useCallback(
    (textToInsert: string) => {
      const textarea = textareaRef.current
      if (!textarea) {
        // Fallback if ref is not ready
        onChange(value ? set(value + '\n' + textToInsert) : set(textToInsert))
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)

      const newValue = before + textToInsert + after
      onChange(newValue ? set(newValue) : unset())

      // Focus back and position selection after the inserted text
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
      }, 0)
    },
    [value, onChange]
  )

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WebP, SVG, etc.).')
        return
      }

      setIsUploading(true)
      try {
        const assetDoc = await client.assets.upload('image', file, {
          filename: file.name,
        })
        const cleanName = file.name.replace(/\.[^/.]+$/, '')
        const markdownImage = `![${cleanName}](${assetDoc.url})`
        insertAtCursor(markdownImage)
      } catch (error) {
        console.error('Failed to upload image:', error)
        alert('Failed to upload image. Please try again.')
      } finally {
        setIsUploading(false)
      }
    },
    [client, insertAtCursor]
  )

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleUpload(file)
      }
    },
    [handleUpload]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLTextAreaElement>) => {
      const file = event.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        event.preventDefault()
        handleUpload(file)
      }
    },
    [handleUpload]
  )

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Combine refs so both Sanity's focus management and our cursor insertion work
  const handleRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      // @ts-ignore
      textareaRef.current = el
      if (elementProps.ref) {
        if (typeof elementProps.ref === 'function') {
          elementProps.ref(el)
        } else {
          elementProps.ref.current = el
        }
      }
    },
    [elementProps.ref]
  )

  // Calculate word and character count
  const charCount = value.length
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <Stack space={2}>
      <Card border tone="default" padding={1} radius={2}>
        <TextArea
          {...elementProps}
          ref={handleRef}
          value={value}
          onChange={handleChange}
          onDrop={handleDrop}
          rows={14}
          dir="auto"
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
            fontSize: '14px',
            lineHeight: '1.6',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            width: '100%',
            padding: '8px',
          }}
          placeholder={`Enter ${schemaType?.title || 'content'} in Markdown... Drag & drop an image here to upload.`}
        />
      </Card>
      <Flex justify="space-between" align="center" paddingX={1}>
        <Flex gap={2} align="center">
          <Button
            fontSize={1}
            padding={2}
            mode="bleed"
            tone="default"
            text={isUploading ? 'Uploading Image...' : '📷 Upload & Insert Image'}
            onClick={triggerFileSelect}
            disabled={isUploading}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </Flex>
        <Text size={1} muted>
          {wordCount} words | {charCount} chars
        </Text>
      </Flex>
    </Stack>
  )
}


