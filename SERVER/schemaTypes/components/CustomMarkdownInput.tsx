import React, { useCallback } from 'react'
import { TextArea, Card, Text, Flex, Stack } from '@sanity/ui'
import { set, unset } from 'sanity'

export function CustomMarkdownInput(props: any) {
  const { value = '', onChange, elementProps, schemaType } = props

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = event.currentTarget.value
      onChange(nextValue ? set(nextValue) : unset())
    },
    [onChange]
  )

  // Calculate word and character count
  const charCount = value.length
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <Stack space={2}>
      <Card border tone="default" padding={1} radius={2}>
        <TextArea
          {...elementProps}
          value={value}
          onChange={handleChange}
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
          placeholder={`Enter ${schemaType?.title || 'content'} in Markdown...`}
        />
      </Card>
      <Flex justify="space-between" align="center" paddingX={1}>
        <Text size={1} muted>
          ✍️ RTL-Friendly Editor (Auto-detects Arabic 🇸🇦 / English 🇺🇸 / Russian 🇷🇺)
        </Text>
        <Text size={1} muted>
          {wordCount} words | {charCount} chars
        </Text>
      </Flex>
    </Stack>
  )
}

