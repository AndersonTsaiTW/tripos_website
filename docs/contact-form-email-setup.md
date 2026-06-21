# 聯絡表單寄信設定筆記

這份文件記錄 `contact.html` 的「聯絡我們」表單如何透過 Cloudflare Pages Functions 和 Resend 寄信。

## 現在的流程

使用者在網站按下 `Send Inquiry` 後：

1. 前端 `script.js` 會攔截表單送出。
2. 表單資料會 POST 到 `/api/contact`。
3. Cloudflare Pages 會執行 `functions/api/contact.js`。
4. `contact.js` 會用 Resend API 寄出 email。
5. 寄信成功時，頁面會顯示成功訊息。
6. 如果 API 失敗或目前不是跑在 Cloudflare Pages 上，前端會退回 `mailto:`，打開使用者自己的 email app。

## 相關檔案

- `contact.html`
  - 聯絡表單本體。
  - 表單 action 是 `/api/contact`。

- `script.js`
  - 處理表單送出。
  - 成功時顯示成功訊息。
  - 失敗時退回 `mailto:triposcanada@gmail.com`。

- `functions/api/contact.js`
  - Cloudflare Pages Function。
  - 接收表單資料。
  - 呼叫 Resend API 寄信。

- `.env.example`
  - 環境變數範例。
  - 不放真正的 API key。

- `.env`
  - 本機用的實際環境變數。
  - 已經放進 `.gitignore`，不要 commit。

## 寄件人與收件人

目前後端預設值是：

```text
From: TriPOS <hello@tripos.ca>
To: triposcanada@gmail.com
Reply-To: 使用者在表單填的 email
```

也就是說：

- `CONTACT_FROM` 是寄件人。
- `CONTACT_TO` 是收件人。
- 使用者填的 email 會放在 `Reply-To`。

收到信之後，如果直接按「回覆」，會回覆到使用者填的 email。

## Resend 負責什麼

Resend 主要負責「寄信」。

它最在意的是 `CONTACT_FROM` 裡面的 email domain：

```text
CONTACT_FROM=TriPOS <hello@tripos.ca>
```

所以 Resend 需要驗證：

```text
tripos.ca
```

網站本身可以繼續使用 Cloudflare Pages 的網址：

```text
trillium-website.pages.dev
```

網站網址和寄信網域可以不同。

## Resend 設定步驟

1. 登入 Resend。

   ```text
   https://resend.com
   ```

2. 到 `Domains`。

3. 新增 domain：

   ```text
   tripos.ca
   ```

4. Resend 會給幾筆 DNS records。

   常見會有 SPF、DKIM、TXT、CNAME 之類的紀錄。

5. 到 `tripos.ca` 的 DNS 管理頁，把 Resend 給的 records 加進去。

6. 回 Resend 等它顯示 domain verified。

7. 到 `API Keys`。

8. 建立一個新的 API key。

9. 複製開頭像這樣的 key：

   ```text
   re_xxxxxxxxx
   ```

這個 key 只能放在 Cloudflare 的 Secret 或本機 `.env`，不要放進 GitHub。

## Cloudflare Pages 設定

到 Cloudflare：

```text
Workers & Pages
→ trillium-website
→ Settings
→ Variables and Secrets
```

加入這三個變數：

```text
RESEND_API_KEY=你的 Resend API key
CONTACT_FROM=TriPOS <hello@tripos.ca>
CONTACT_TO=triposcanada@gmail.com
```

如果正式收件信箱還沒有真的能收信，可以先用自己的 Gmail 測試：

```text
CONTACT_TO=yourname@gmail.com
```

但是 `CONTACT_FROM` 建議維持使用已經在 Resend 驗證過的網域：

```text
CONTACT_FROM=TriPOS <hello@tripos.ca>
```

設定完環境變數後，要重新部署 Cloudflare Pages。

## 本機 `.env` 範例

本機可以參考 `.env.example`：

```text
RESEND_API_KEY=re_your_resend_api_key
CONTACT_FROM=TriPOS <hello@tripos.ca>
CONTACT_TO=triposcanada@gmail.com
```

注意：`.env` 已經被 `.gitignore` 忽略，不要把真正的 API key commit 上去。

## 測試方式

部署完成後：

1. 打開 Cloudflare Pages 的網站：

   ```text
   https://trillium-website.pages.dev
   ```

2. 到 Contact 頁面。

3. 填入：

   ```text
   Name
   Email
   Restaurant
   Message
   ```

4. 按 `Send Inquiry`。

5. 成功時頁面會顯示：

   ```text
   Thanks. Your inquiry has been sent.
   ```

6. 到 `CONTACT_TO` 的信箱確認有沒有收到信。

## 常見狀況

### 按下送出後打開 email app

代表 `/api/contact` 沒有成功。

可能原因：

- 目前不是在 Cloudflare Pages 上測試。
- Cloudflare Pages 還沒重新部署。
- `RESEND_API_KEY` 沒設。
- Resend domain 還沒 verified。
- `CONTACT_FROM` 的 domain 不是 Resend 驗證過的 domain。

### Resend 不讓我用 `hello@tripos.ca`

通常是因為 `tripos.ca` 還沒有完成 domain verification。

要回 Resend 的 `Domains` 看 DNS records 是否都通過。

### 收不到信

先確認：

- `CONTACT_TO` 是一個真的能收信的 email。
- 垃圾信匣有沒有信。
- Resend dashboard 裡有沒有發送紀錄。
- Cloudflare Pages deployment 是否成功。

## 目前決定

- 網站可以繼續用 Cloudflare Pages 預設網域。
- 寄件網域使用 `tripos.ca`。
- Resend 只需要驗證 `CONTACT_FROM` 裡的 domain。
- `CONTACT_TO` 可以先用 Gmail 測試，再改成正式信箱。
