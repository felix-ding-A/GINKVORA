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
  const [initialWeights, setInitialWeights] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({})
  const [statusMap, setStatusMap] = useState<Record<string, 'saved' | 'error' | null>>({})
  const [isBatchSaving, setIsBatchSaving] = useState<boolean>(false)
  const [batchStatus, setBatchStatus] = useState<'saved' | 'error' | null>(null)

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
      const fetched: ProductItem[] = (data || []).map((p: any) => ({
        ...p,
        weight: typeof p.weight === 'number' ? p.weight : 0,
      }))
      setProducts(fetched)
      const initMap: Record<string, number> = {}
      fetched.forEach((p) => {
        initMap[p._id] = p.weight
      })
      setInitialWeights(initMap)
      setBatchStatus(null)
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
    setBatchStatus(null)
  }

  // Single Item Save
  const saveProductWeight = async (id: string, weightToSave: number) => {
    setSavingMap((prev) => ({ ...prev, [id]: true }))
    try {
      await client.patch(id).set({ weight: weightToSave }).commit()
      setInitialWeights((prev) => ({ ...prev, [id]: weightToSave }))
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

  // Batch Save All Modified Products via Sanity Transaction
  const saveAllWeights = async () => {
    const modifiedItems = products.filter(
      (p) => p.weight !== (initialWeights[p._id] ?? 0)
    )
    if (modifiedItems.length === 0) return

    setIsBatchSaving(true)
    setBatchStatus(null)
    try {
      const tx = client.transaction()
      modifiedItems.forEach((p) => {
        tx.patch(p._id, (patch) => patch.set({ weight: p.weight }))
      })
      await tx.commit()

      const newInitMap: Record<string, number> = {}
      products.forEach((p) => {
        newInitMap[p._id] = p.weight
      })
      setInitialWeights(newInitMap)
      setBatchStatus('saved')
      setTimeout(() => setBatchStatus(null), 3000)
    } catch (err) {
      console.error('Failed to batch save weights:', err)
      setBatchStatus('error')
    } finally {
      setIsBatchSaving(false)
    }
  }

  const modifiedCount = products.filter(
    (p) => p.weight !== (initialWeights[p._id] ?? 0)
  ).length

  const filteredProducts = products.filter(
    (p) =>
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
              可以在此集中为多个产品填写权重（0 - 9999），改完后点击顶部的 **“💾 保存所有修改”** 即可一键更新全部数据。
            </Text>
          </Box>
          <Flex gap={2} align="center" wrap="wrap">
            <Badge tone="primary">总产品: {products.length}</Badge>
            <Badge tone="positive">已设权重 (&gt;0): {highPriorityCount}</Badge>
            {modifiedCount > 0 && (
              <Badge tone="caution">未保存修改: {modifiedCount} 个</Badge>
            )}

            {/* Main One-Click Batch Save Button */}
            <Button
              tone={modifiedCount > 0 ? 'primary' : 'default'}
              mode={modifiedCount > 0 ? 'default' : 'ghost'}
              text={
                isBatchSaving
                  ? '保存中...'
                  : modifiedCount > 0
                  ? `💾 保存所有修改 (${modifiedCount})`
                  : '✓ 已是最新状态'
              }
              disabled={isBatchSaving || modifiedCount === 0}
              onClick={saveAllWeights}
            />

            {batchStatus === 'saved' && <Badge tone="positive">全部已保存 ✓</Badge>}
            {batchStatus === 'error' && <Badge tone="critical">批量保存失败 ❌</Badge>}

            <Button
              tone="default"
              mode="ghost"
              text="刷新列表"
              disabled={loading || isBatchSaving}
              onClick={fetchProducts}
            />
          </Flex>
        </Flex>

        {/* Search Bar */}
        <TextInput
          placeholder="🔍 搜索产品名称或中文名..."
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
                const isModified = product.weight !== (initialWeights[product._id] ?? 0)

                return (
                  <Card
                    key={product._id}
                    padding={3}
                    radius={2}
                    shadow={1}
                    border
                    style={{
                      backgroundColor: isModified
                        ? 'rgba(234, 179, 8, 0.08)'
                        : product.weight > 0
                        ? 'rgba(16, 185, 129, 0.05)'
                        : undefined,
                      borderColor: isModified ? '#eab308' : undefined,
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
                            {isModified && <Badge tone="caution">已修改未保存</Badge>}
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
                      <Flex align="center" gap={2} style={{ minWidth: '300px' }}>
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

                        {/* Quick Preset Buttons */}
                        <Button
                          mode="ghost"
                          tone="default"
                          text="9999"
                          onClick={() => handleWeightChange(product._id, '9999')}
                        />
                        <Button
                          mode="ghost"
                          tone="default"
                          text="清零"
                          onClick={() => handleWeightChange(product._id, '0')}
                        />

                        {/* Optional Single Save */}
                        <Button
                          tone="primary"
                          mode="ghost"
                          text={isSaving ? '保存中...' : '单条保存'}
                          disabled={isSaving || !isModified}
                          onClick={() => saveProductWeight(product._id, product.weight)}
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

