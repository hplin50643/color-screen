# 全螢幕調色盤 · Color Screen

固定深色介面、預設黑色的純前端調色工具。選好顏色後，可以隱藏所有控制項，讓純色填滿畫面。支援 RWD、PWA 安裝與離線使用。

原生 HTML、CSS、JavaScript，沒有框架、後端、CDN、追蹤器或執行期套件。此資料夾是獨立專案，不會連線或修改 AS7341／ESP32 程式。

## 使用方式

- 每次重新開啟或重新整理都從黑色 `#000000` 開始，不記錄上次顏色。
- 拖曳二維調色盤選擇飽和度與明度，使用色相滑桿切換色相；也可用獨立的飽和度／明度滑桿操作。
- HEX 接受三位或六位色碼，可省略 `#`，例如 `#ABC`、`12ABEF`。輸入完成並離開欄位後，統一顯示六位大寫色碼。
- RGB 接受 0–255 整數。無效或尚未完成的輸入會保留在欄位內並顯示提示，不改變最後有效顏色。
- 點選常用色票快速切換黑、白、紅、綠、藍、黃、青、洋紅色。
- 點擊「全螢幕顯色」隱藏面板、文字及游標。點一下畫面或按 `Esc` 返回；返回時焦點回到顯色按鈕。
- 鍵盤可以用 `Tab` 移動，方向鍵調整各滑桿，`Home`／`End` 到達端點。二維指標控制另有飽和度與明度滑桿作為完整鍵盤／讀屏替代。

深色模式只影響介面，不會壓暗所選顏色。顯色區使用不透明、8-bit sRGB，不套用漸層、動畫、亮度濾鏡或透明度。

## 本機預覽

部署到 GitHub Pages **不需要 Node.js、不需要安裝套件，也不需要打包**。本機預覽與開發測試可選用 Node.js 20 或更新版本：

```sh
node tools/serve.mjs
```

預設開啟 `http://localhost:4173/`。如埠號被占用，可在 PowerShell 指定另一個埠：

```powershell
$env:PORT = '48731'
node tools/serve.mjs
```

也可使用任何能正確提供 JavaScript 與 manifest MIME 類型的靜態伺服器。本機伺服器只監聽 loopback，並不是後端功能。

請勿直接雙擊 HTML 檔案；`file://` 不支援本專案的模組載入與完整 PWA 功能。PWA 安裝／Service Worker 需要 **HTTPS 或 localhost**。用區網 HTTP IP 在實體手機上瀏覽時，調色可用，但離線與安裝功能可能無法啟用。

### 模擬 GitHub Pages 子路徑

```powershell
$env:PORT = '48732'
$env:BASE_PATH = '/color-screen/'
node tools/serve.mjs
```

開啟 `http://localhost:48732/color-screen/`。`BASE_PATH` 前後都要有 `/`。上述環境變數只影響本機工具，正式網站不需要設定。

## 發布到 GitHub Pages

1. 在 GitHub 建立自己的儲存庫，例如 `color-screen`。
2. 將**這個資料夾內的內容**放到儲存庫根目錄，讓首頁 HTML 位於根目錄，而不是再包一層資料夾。保留 `.nojekyll`、manifest、Service Worker 與所有圖示。
3. 將檔案上傳／提交到 `main` 分支。
4. 到儲存庫的 **Settings → Pages → Build and deployment**。
5. Source 選 **Deploy from a branch**，Branch 選 **main**，資料夾選 **/(root)**，儲存設定。
6. 等待 GitHub 顯示部署完成，再使用 Pages 設定頁提供的 HTTPS 網址。

通常網址為 `https://你的帳號.github.io/儲存庫名稱/`。使用者首頁儲存庫及自訂網域的根目錄也能運作，因為資源、manifest、啟動網址與 Service Worker 均採相對路徑。請保留目錄尾端的 `/`，或讓主機正常重新導向。

無須設定 GitHub Actions 工作流程、API Key、資料庫或自訂網域。本專案沒有自動建立遠端儲存庫或公開發布的指令。公開前請確認儲存庫內沒有私人檔案；若要加入開源授權，請由專案擁有者自行選擇。

官方說明：[設定 GitHub Pages 發布來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 安裝與離線

- 支援安裝提示的瀏覽器：使用介面中的「安裝應用程式」，或瀏覽器網址列／選單內的安裝入口。
- iPhone／iPad：在瀏覽器分享選單選擇「加入主畫面」。
- Mac Safari：可使用「加入 Dock」。安裝入口及名稱會依平台、版本不同。
- 從主畫面啟動採獨立視窗模式；manifest 的背景色與主題色均為黑色。
- 首次連線成功，並看見「已可離線使用」後，才表示離線資源已準備好。之後可在離線狀態重新開啟及調色。
- 瀏覽器若停用儲存空間、清除網站資料或回收快取，需要重新連線快取。初次未快取時無法憑空離線載入。
- 安裝並非調色的必要條件，瀏覽器不支援安裝時仍可當作普通網頁使用。

### 更新版本

修改任何正式網站資源時，**同時遞增 Service Worker 中的 `VERSION`**；保留 Service Worker 的固定檔名及位置。

新版會完整快取後等待，介面顯示「新版已備妥，關閉分頁後啟用」。請關閉此網站所有分頁和已安裝應用程式視窗，再重新開啟，讓新版生效。單純重新整理可能仍使用舊版，這是為了不在顯色途中強制重載，也避免混用不同版本的資源。

快取名稱包含完整網站作用範圍與版本。啟用新版時只移除此應用同一作用範圍的舊版快取，不會移除其他 GitHub Pages 專案的資料。

## 瀏覽器限制

- 原生 Fullscreen API 只在使用者點擊後嘗試啟用；遭拒或不支援時，仍會切換為純色網頁模式。
- 部分行動瀏覽器，尤其 iPhone，不能保證用 Fullscreen API 隱藏瀏覽器或系統介面。從已安裝的 PWA 開啟可減少瀏覽器介面，但狀態列、手勢區和系統提示仍由裝置決定。
- 顏色值是 sRGB 數值，不代表經校準的實體光源。螢幕亮度、色彩描述檔、夜間模式、HDR 和裝置面板都可能影響實際觀感。
- 不包含螢幕常亮／防休眠功能；長時間顯色需自行調整裝置休眠設定。

參考：[PWA 安裝條件](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)、[Fullscreen API 相容性](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen)。

## 開發與驗證

```sh
node --test tests/*.test.mjs
```

測試涵蓋色碼驗證、RGB／HSV 往返、黑色／灰階色相保留、全螢幕拒絕與延遲返回、根目錄／子路徑快取、版本隔離、圖示尺寸及離線資源完整性。測試使用 Node 內建工具，不需下載套件。

圖示由幾何向量設計產生。需要重新產生已隨專案提供的 PNG 圖示時，執行：

```sh
node tools/generate-icons.mjs
```

在提供 `document.modelContext` 的瀏覽器中，頁面另提供可選的 `get_color`（讀取目前顏色）與 `set_color({ hex })`（同步設定顏色）工具。它們共用畫面狀態，不會自動進入全螢幕；不支援時不影響網站功能，也不會連接外部服務。

### 手動驗收清單

- [ ] 每次開啟預設黑色；系統為淺色模式時控制介面仍為深色。
- [ ] HEX／RGB／各滑桿／色票同步，錯誤輸入不改變顏色。
- [ ] 在黑色選好色相和飽和度，再提高明度，可得到對應色彩。
- [ ] 顯色模式只留下純色，點擊／Esc／系統退出全螢幕均可返回。
- [ ] 320px 手機、768px 平板、1440px 桌面、橫向與 200% 縮放時沒有水平溢出，控制項皆可到達。
- [ ] 根目錄與儲存庫子路徑下無缺失素材，首次成功快取後離線重開仍可使用。
- [ ] 安裝到實體 Android／iOS 裝置並重新開啟；確認平台專有狀態列及安全區。
- [ ] 舊分頁開啟時更新不會中斷顯色；全部關閉後才採用新版。

此專案沒有收藏、歷史記錄、帳號、雲端同步或硬體通訊功能。
