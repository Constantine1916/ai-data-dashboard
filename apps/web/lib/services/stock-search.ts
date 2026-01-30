/**
 * 股票查询服务
 * 直接调用网易财经和腾讯股票的原始 API
 */

export interface StockData {
  code: string
  name: string
  now: number
  yesterday: number
  percent: number
  high: number
  low: number
}

/**
 * 格式化股票代码
 */
export function formatStockCode(code: string): string {
  let formattedCode = code.toUpperCase().trim()
  
  // 如果只是数字，自动添加交易所前缀
  if (/^\d+$/.test(formattedCode)) {
    if (formattedCode.startsWith('6')) {
      formattedCode = `SH${formattedCode}`
    } else if (formattedCode.startsWith('0') || formattedCode.startsWith('3')) {
      formattedCode = `SZ${formattedCode}`
    }
  }
  
  return formattedCode
}

/**
 * 从腾讯股票获取股票数据
 */
async function getStockFromTencent(code: string): Promise<StockData | null> {
  try {
    const tencentCode = code.toLowerCase()
    const url = `https://qt.gtimg.cn/q=${tencentCode}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://gu.qq.com/',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const text = await response.text()
    const match = text.match(/="([^"]+)"/)
    if (!match) {
      return null
    }
    
    const parts = match[1].split('~')
    if (parts.length < 40) {
      return null
    }
    
    const name = parts[1]
    const now = parseFloat(parts[3]) || 0
    const yesterday = parseFloat(parts[4]) || 0
    const high = parseFloat(parts[33]) || 0
    const low = parseFloat(parts[34]) || 0
    
    if (now === 0) {
      return null
    }
    
    const percent = yesterday !== 0 ? ((now - yesterday) / yesterday) * 100 : 0
    
    return {
      code,
      name,
      now,
      yesterday,
      percent,
      high,
      low,
    }
  } catch (error) {
    console.error('[Tencent] 查询失败:', error)
    return null
  }
}

/**
 * 查询股票实时数据
 */
export async function searchStock(code: string): Promise<{
  data: StockData | null
  source: string
  error?: string
}> {
  const formattedCode = formatStockCode(code)
  
  const tencentData = await getStockFromTencent(formattedCode)
  if (tencentData) {
    return {
      data: tencentData,
      source: 'tencent',
    }
  }
  
  return {
    data: null,
    source: '',
    error: '未找到该股票，请检查代码是否正确',
  }
}
