// 在内存中存储助力码（重启会丢失，生产环境建议用数据库）
let storage = [
  { code: "8602346660", date: "04/29 08:52", used: false, timestamp: Date.now() - 100000 },
  { code: "8612344478", date: "04/29 08:46", used: true, timestamp: Date.now() - 200000 },
  { code: "8562344880", date: "04/29 08:43", used: false, timestamp: Date.now() - 300000 }
];

export default async function handler(req, res) {
  // 设置 CORS 头部（允许跨域请求）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET 请求：获取助力码列表
  if (req.method === 'GET') {
    const sorted = [...storage].sort((a, b) => b.timestamp - a.timestamp);
    return res.status(200).json({ codes: sorted.slice(0, 20) }); // 返回最新20条
  }

  // POST 请求：提交新的助力码
  if (req.method === 'POST') {
    const { code, date, timestamp } = req.body;
    
    // 检查是否已存在
    if (storage.some(c => c.code === code)) {
      return res.status(400).json({ error: '该助力码已存在' });
    }

    // 添加新记录
    storage.unshift({ code, date, used: false, timestamp });
    
    // 限制最多20条
    if (storage.length > 20) storage.pop();
    
    return res.status(200).json({ success: true });
  }

  // PUT 请求：更新助力码状态（跳转→已使用）
  if (req.method === 'PUT') {
    const urlParts = req.url.split('/');
    const code = urlParts[urlParts.length - 1]; // 从 URL 中提取助力码
    const { used } = req.body;
    
    const index = storage.findIndex(c => c.code === code);
    if (index !== -1) {
      storage[index].used = used;
      storage[index].timestamp = Date.now(); // 更新时间戳
    }
    
    return res.status(200).json({ success: true });
  }

  // 其他方法返回错误
  res.status(405).json({ error: 'Method not allowed' });
}