import React, { useState, useEffect } from 'react'
import { useDocumentOperation } from 'sanity'
import { Box, Button, Card, Stack, Text, TextArea, TextInput, Spinner, Flex } from '@sanity/ui'

export function GenerateWithAIAction(props: any) {
  const { patch } = useDocumentOperation(props.id, props.type)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const doc = props.draft || props.published || {}

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('OPENAI_API_KEY') || ''
    setApiKey(savedKey)
    setTempApiKey(savedKey)
  }, [])

  // Update default prompt when dialog opens or document title/name changes
  useEffect(() => {
    if (isDialogOpen) {
      if (props.type === 'post') {
        const title = doc.title || ''
        setPrompt(
          `Write an engaging professional B2B blog post about: "${title}".\n` +
          `The output must be a JSON object with the following fields:\n` +
          `1. "excerpt": A short engaging summary (max 200 characters)\n` +
          `2. "body": An array of strings, where each string represents a paragraph of the article (3-4 paragraphs total)\n` +
          `3. "tags": An array of strings representing tags. Pick 1-3 from: ['Industry News', 'Ingredient Spotlight', 'Research', 'Regulatory', 'Market Trends', 'Quality & Testing', 'Formulation Tips']`
        )
      } else if (props.type === 'product') {
        const name = doc.name || ''
        setPrompt(
          `Write professional B2B specifications for the plant extract/chemical product: "${name}".\n` +
          `The output must be a JSON object with the following fields:\n` +
          `1. "botanicalName": Botanical/scientific Latin name of the source plant\n` +
          `2. "activeIngredient": The main active compound (e.g. "Resveratrol", "EGCG")\n` +
          `3. "purity": Standard B2B purity specification (e.g. "≥ 98%", "40% HPLC")\n` +
          `4. "shortDescription": 1-2 sentence professional summary for B2B buyer\n` +
          `5. "shelfLife": Recommended shelf life (e.g. "24 months")\n` +
          `6. "storageConditions": Standard storage instructions (e.g. "Store in cool, dry place...")`
        )
      }
      setError('')
      setSuccess(false)
    }
  }, [isDialogOpen, props.type, doc.title, doc.name])

  const handleSaveApiKey = () => {
    localStorage.setItem('OPENAI_API_KEY', tempApiKey.trim())
    setApiKey(tempApiKey.trim())
    setError('')
  }

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please set your OpenAI API Key first.')
      return
    }

    // Validation: make sure there is a title/name to base the generation on
    if (props.type === 'post' && !doc.title) {
      setError('Please enter a Title for the blog post before generating.')
      return
    }
    if (props.type === 'product' && !doc.name) {
      setError('Please enter a Product Name before generating.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a professional B2B copywriter for plant extracts and nutritional ingredients. You must output raw JSON only matching the requested schema structure.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error?.message || `HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      const contentText = data.choices[0]?.message?.content

      if (!contentText) {
        throw new Error('No content returned from OpenAI API.')
      }

      const parsed = JSON.parse(contentText)

      if (props.type === 'post') {
        // Build body blocks for portable text
        const bodyBlocks = Array.isArray(parsed.body)
          ? parsed.body.map((para: string) => ({
              _key: Math.random().toString(36).substring(2, 9),
              _type: 'block',
              children: [
                {
                  _key: Math.random().toString(36).substring(2, 9),
                  _type: 'span',
                  text: para,
                },
              ],
            }))
          : [
              {
                _key: Math.random().toString(36).substring(2, 9),
                _type: 'block',
                children: [
                  {
                    _key: Math.random().toString(36).substring(2, 9),
                    _type: 'span',
                    text: String(parsed.body || ''),
                  },
                ],
              },
            ]

        // Apply patches to document
        patch.execute([
          {
            set: {
              excerpt: parsed.excerpt || '',
              tags: Array.isArray(parsed.tags) ? parsed.tags : [],
              body: bodyBlocks,
            },
          },
        ])
      } else if (props.type === 'product') {
        // Apply patches to product document
        patch.execute([
          {
            set: {
              botanicalName: parsed.botanicalName || '',
              activeIngredient: parsed.activeIngredient || '',
              purity: parsed.purity || '',
              shortDescription: parsed.shortDescription || '',
              shelfLife: parsed.shelfLife || '',
              storageConditions: parsed.storageConditions || '',
            },
          },
        ])
      }

      setSuccess(true)
      setTimeout(() => {
        setIsDialogOpen(false)
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to generate content.')
    } finally {
      setLoading(false)
    }
  }

  return {
    label: 'AI一键生成',
    icon: () => '✨',
    title: '使用 OpenAI GPT-4o-mini 智能生成文章/规格内容',
    onHandle: () => {
      setIsDialogOpen(true)
    },
    dialog: isDialogOpen && {
      type: 'dialog' as const,
      header: '✨ GPT AI 一键智能内容生成',
      onClose: () => setIsDialogOpen(false),
      content: (
        <Card padding={4}>
          <Stack space={4}>
            {!apiKey ? (
              <Stack space={3}>
                <Text size={1} weight="semibold">配置您的 OpenAI API Key</Text>
                <Text size={1} muted>
                  密钥仅保存在您的本地浏览器缓存 (localStorage) 中，不会上传到任何服务器，安全可靠。
                </Text>
                <TextInput
                  type="password"
                  placeholder="sk-..."
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.currentTarget.value)}
                />
                <Button
                  text="保存密钥"
                  tone="primary"
                  onClick={handleSaveApiKey}
                  disabled={!tempApiKey.trim()}
                />
              </Stack>
            ) : (
              <Stack space={3}>
                {loading ? (
                  <Flex align="center" justify="center" direction="column" padding={4}>
                    <Spinner size={3} />
                    <Box marginTop={3}>
                      <Text size={2} weight="semibold">AI 正在努力撰写中，请稍候...</Text>
                    </Box>
                  </Flex>
                ) : (
                  <>
                    {success ? (
                      <Card padding={3} tone="positive">
                        <Text align="center" weight="bold">🎉 生成并填充成功！正在关闭窗口...</Text>
                      </Card>
                    ) : (
                      <>
                        <Text size={1} weight="semibold">生成提示词 (Prompt)：</Text>
                        <TextArea
                          rows={6}
                          value={prompt}
                          onChange={(e) => setPrompt(e.currentTarget.value)}
                        />
                        {error && (
                          <Card padding={3} tone="critical">
                            <Text size={1} weight="semibold">❌ 错误: {error}</Text>
                          </Card>
                        )}
                        <Flex gap={2} justify="flex-end" marginTop={2}>
                          <Button
                            text="修改 API Key"
                            mode="ghost"
                            onClick={() => setApiKey('')}
                          />
                          <Button
                            text="✨ 开始生成并填入"
                            tone="primary"
                            onClick={handleGenerate}
                          />
                        </Flex>
                      </>
                    )}
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </Card>
      ),
    },
  }
}
