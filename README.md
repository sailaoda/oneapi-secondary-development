### 手动部署
1. 从源码编译：
   ```shell
   # 构建前端
   cd web
   npm install
   npm run build
   
   # 构建后端
   cd ..
   go mod download
   go build -ldflags "-s -w" -o azure-openai-one-api
   
   ````
2. 运行：
   ```shell
   chmod u+x azure-openai-one-api
   ./azure-openai-one-api --port 3000 --log-dir ./logs
   ```
3. 访问 [http://localhost:3000/](http://localhost:3000/) 并登录。初始账号用户名为 `root`，密码为 `123456`。

4. 使用
   ```python
   import openai
   
   openai.api_key = 'sk-xxxxxxxxxxx' # 令牌处创建，获得
   openai.api_base = 'http://localhost:3000/v1'
   
   messages = [{"role": "user", "content": "你是谁"}]
   response = openai.ChatCompletion.create(
       #model='gpt-4',
       model='gpt-3.5-turbo',
       # model='gpt-4-32k',
       # model='gpt-3.5-turbo-16k',
       messages=messages
   )
   print(response['choices'][0]['message']['content'])
   
   
   ```


## 配置
系统本身开箱即用。

你可以通过设置环境变量或者命令行参数进行配置。

等到系统启动后，使用 `root` 用户登录系统并做进一步的配置。

**Note**：如果你不知道某个配置项的含义，可以临时删掉值以看到进一步的提示文字。

## 使用方法
在`渠道`页面中添加你的 API Key，之后在`令牌`页面中新增访问令牌。

之后就可以使用你的令牌访问 One API 了，使用方式与 [OpenAI API](https://platform.openai.com/docs/api-reference/introduction) 一致。

你需要在各种用到 OpenAI API 的地方设置 API Base 为你的 One API 的部署地址，例如：`https://openai.justsong.cn`，API Key 则为你在 One API 中生成的令牌。

注意，具体的 API Base 的格式取决于你所使用的客户端。

例如对于 OpenAI 的官方库：
```bash
OPENAI_API_KEY="sk-xxxxxx"
OPENAI_API_BASE="https://<HOST>:<PORT>/v1" 
```

```mermaid
graph LR
    A(用户)
    A --->|使用 One API 分发的 key 进行请求| B(One API)
    B -->|中继请求| C(OpenAI)
    B -->|中继请求| D(Azure)
    B -->|中继请求| E(其他 OpenAI API 格式下游渠道)
    B -->|中继并修改请求体和返回体| F(非 OpenAI API 格式下游渠道)
```

可以通过在令牌后面添加渠道 ID 的方式指定使用哪一个渠道处理本次请求，例如：`Authorization: Bearer ONE_API_KEY-CHANNEL_ID`。
注意，需要是管理员用户创建的令牌才能指定渠道 ID。

不加的话将会使用负载均衡的方式使用多个渠道。
