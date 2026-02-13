// 测试脚本 - 验证指数API
import { EastMoneyService } from './lib/services/eastmoney'

async function test() {
  console.log('测试获取指数数据...')
  
  try {
    const indices = await EastMoneyService.getMarketIndices()
    
    console.log(`获取到 ${indices.length} 个指数`)
    console.log()
    
    for (const index of indices) {
      console.log(`${index.name} (${index.code}):`)
      console.log(`  价格: ${index.price > 0 ? index.price.toFixed(2) : 'N/A'}`)
      console.log(`  涨跌幅: ${index.changePercent > 0 ? '+' : ''}${index.changePercent.toFixed(2)}%`)
      console.log()
    }
    
    console.log('测试完成!')
  } catch (error) {
    console.error('测试失败:', error)
  }
}

test()
