import React, { useState, useEffect, useCallback } from 'react'
import { Card, Stack, Text, Flex, TextInput, Button, Spinner, Badge, Box, Heading } from '@sanity/ui'
import { useClient } from 'sanity'

interface ProductItem {
  _id: string
  name: string
  cname?: string
  weight: number
  categoryName?: string
  heroImageUrl?: string
}

export function QuickWeightEditor() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [statusMap, setStatusMap] = useState<Record<string, 'saved' | 'error' | null>>({})

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await client.fetch(`
        *[_type == "product"] | order(coalesce(weight, 0) desc, _updatedAt desc) {
          _id,
          name,
          cname,
          weight,
          "categoryName": category[0]->name,
          "heroImageUrl": heroImage.asset->url
        }
      `)
      setProducts(
        (data || []).map((p: any) => ({
          ...p,
          weight: typeof p.weight === 'number' ? p.weight : 0,
        }))
      )
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleWeightChange = (id: string, value: string) => {
    const parsed = parseInt(value, 10)
    const newWeight = isNaN(parsed) ? 0 : Math.max(0, Math.min(9999, parsed))
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, weight: newWeight } : p)))
    setStatusMap((prev) => ({ ...prev, [id]: null }))
  }

  const saveProductWeight = async (id: string, weightToSave: number) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      await client.patch(id).set({ weight: weightToSave }).commit()
      setStatusMap((prev) => ({ ...prev, [id]: 'saved' }))
      setTimeout(() => {
        setStatusMap((prev) => ({ ...prev, [id]: null }))
      }, 3000)
    } catch (err) {
      console.error(`Failed to save weight for ${id}:`, err)
      setStatusMap((prev) => ({ ...prev, [id]: 'error' }))
    } finally {
      setSavingMap((prev) => ({ ...prev, [id]: false }))
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cname && p.cname.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const highPriorityCount = products.filter((p) => p.weight > 0).length

  return (
    <Card padding={4} tone="inherit">
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Box>
            <Heading size={2}>⚡ 快捷权重修改器 (Quick Weight Editor)</Heading>
            <Text size={1} muted style={{ marginTop: '4px' }}>
              直接在此处填入权重分值（0 - 9999），数字越大在前端产品列表页展示越靠前。改完点击“保存”即可，无需点进文档内部。
            </Text>
          </Box>
          <Flex gap={2} align="center">
            <Badge tone="primary">总产品: {products.length}</Badge>
            <Badge tone="positive">已设权重 (&gt;0): {highPriorityCount}</Badge>
            <Button
              tone="default"
              mode="ghost"
              text="刷新列表"
              disabled={loading}
              onClick={fetchProducts}
            />
          </Flex>
        </Flex>

        {/* Search Bar */}
        <TextInput
          placeholder="🔍 搜索产品名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.currentTarget.value)}
        />

        {/* Loading State */}
        {loading ? (
          <Flex padding={5} justify="center" align="center" gap={3}>
            <Spinner />
            <Text muted size={2}>加载产品列表中...</Text>
          </Flex>
        ) : (
          <Stack space={3}>
            {filteredProducts.length === 0 ? (
              <Card padding={4} tone="transparent" border>
                <Text muted align="center">未找到匹配的产品。</Text>
              </Card>
            ) : (
              filteredProducts.map((product) => {
                const isSaving = savingMap[product._id] || false
                const status = statusMap[product._id]

                return (
                  <Card
                    key={product._id}
                    padding={3}
                    radius={2}
                    shadow={1}
                    border
                    style={{
                      backgroundColor: product.weight > 0 ? 'rgba(16, 185, 129, 0.05)' : undefined,
                    }}
                  >
                    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                      {/* Product Info */}
                      <Flex align="center" gap={3} style={{ minWidth: '240px', flex: '1 1 300px' }}>
                        {product.heroImageUrl ? (
                          <img
                            src={product.heroImageUrl}
                            alt={product.name}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 6,
                              objectFit: 'cover',
                              border: '1px solid #ccc',
                            }}
                          />
                        ) : (
                          <Box
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 6,
                              backgroundColor: '#eee',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                            }}
                          >
                            🌿
                          </Box>
                        )}
                        <Stack space={2}>
                          <Flex align="center" gap={2}>
                            <Text weight="bold" size={2}>
                              {product.name}
                              {product.cname && (
                                <Text as="span" weight="regular" size={2} muted style={{ marginLeft: '6px' }}>
                                  ({product.cname})
                                </Text>
                              )}
                            </Text>
                            {product.weight >= 9000 && <Badge tone="critical">爆款明星</Badge>}
                            {product.weight > 0 && product.weight < 9000 && (
                              <Badge tone="positive">权重 {product.weight}</Badge>
                            )}
                          </Flex>
                          {product.categoryName && (
                            <Text size={1} muted>
                              分类: {product.categoryName}
                            </Text>
                          )}
                        </Stack>
                      </Flex>

                      {/* Weight Controls */}
                      <Flex align="center" gap={2} style={{ minWidth: '320px' }}>
                        <Text size={1} weight="semibold" muted>
                          权重 (0-9999):
                        </Text>
                        <Box style={{ width: '100px' }}>
                          <TextInput
                            type="number"
                            value={String(product.weight)}
                            onChange={(e) => handleWeightChange(product._id, e.currentTarget.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveProductWeight(product._id, product.weight)
                            }}
                            style={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        <Button
                          tone="primary"
                          text={isSaving ? '保存中...' : '保存'}
                          disabled={isSaving}
                          onClick={() => saveProductWeight(product._id, product.weight)}
                        />

                        {/* Quick Preset Buttons */}
                        <Button
                          mode="ghost"
                          tone="default"
                          text="9999"
                          onClick={() => {
                            handleWeightChange(product._id, '9999')
                            saveProductWeight(product._id, 9999)
                          }}
                        />
                        <Button
                          mode="ghost"
                          tone="default"
                          text="清零"
                          onClick={() => {
                            handleWeightChange(product._id, '0')
                            saveProductWeight(product._id, 0)
                          }}
                        />

                        {/* Status Badges */}
                        {isSaving && <Spinner size={1} />}
                        {status === 'saved' && <Badge tone="positive">已保存 ✓</Badge>}
                        {status === 'error' && <Badge tone="critical">失败 ❌</Badge>}
                      </Flex>
                    </Flex>
                  </Card>
                )
              })
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
