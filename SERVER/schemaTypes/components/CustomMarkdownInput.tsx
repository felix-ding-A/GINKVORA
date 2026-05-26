import React, { useMemo } from 'react'
import { MarkdownInput, MarkdownInputProps } from 'sanity-plugin-markdown'

export function CustomMarkdownInput(props: any) {
  const reactMdeProps: MarkdownInputProps['reactMdeProps'] = useMemo(() => {
    return {
      options: {
        uploadImage: true,
        imageAccept: 'image/png, image/jpeg, image/gif, image/webp, image/svg+xml',
        imageMaxSize: 10 * 1024 * 1024, // 10MB max upload size
        toolbar: [
          'bold',
          'italic',
          'heading',
          '|',
          'quote',
          'unordered-list',
          'ordered-list',
          '|',
          'link',
          'upload-image', // Displays the dedicated image upload button on the toolbar
          '|',
          'preview',
          'side-by-side',
          'fullscreen'
        ],
        spellChecker: false,
      },
    }
  }, [])

  return <MarkdownInput {...props} reactMdeProps={reactMdeProps} />
}
