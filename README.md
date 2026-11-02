# もんじゃ Microsoft 365 URL Analyzer / Monja Microsoft 365 URL Analyzer
Microsoft Teams、SharePoint Online、OneDriveのURLから識別子やパスを確認する無料ツールです。

[サイトを開く](https://m365url.mnoda1979.chatgpt.site/)

## 使い方

1. URLを貼り付け、「URLを解析」を選択します。基本解析はサインイン不要です。
2. 各結果のコピーボタン、または一括コピー・JSONコピーを利用します。
3. 対応URLでは「Microsoft 365 詳細情報取得」からMicrosoftにサインインし、Graphで詳細を確認できます。

日本語・English・简体中文に対応しています。URLから抽出した値は未確認であり、ファイルの存在やアクセス権を保証しません。Graphの実際の応答から得た値のみ確認済みと表示します。

## 対応リンク

Teamsのチーム・チャネル・メッセージ・会議・チャットリンク、SharePointの直接リンク・共有リンク・AllItems.aspx・Doc.aspx、OneDriveのリンクを基本解析します。Office Onlineに含まれるURLも解析します。短縮リンクや不透明な共有リンクは基本解析のみでは保存先を取得できません。

Graph詳細照会は組織アカウントのTeams（Group IDが必要）とSharePointを対象とします。個人用OneDriveは基本解析のみです。プライベート・共有チャネルは専用サイトを使用する場合があるため、そのSharePointリンクを入力してください。

## Microsoft Entra ID アプリ登録

既定の共通アプリのほか、自分の登録アプリを利用できます。

1. Microsoft Entra管理センターでアプリを登録します。組織内のみならシングルテナント、他組織からも使う場合は組織向けマルチテナントを選択します。
2. 「認証」のSingle-page application（SPA）に、利用するサイトのルートURLを登録します。共通サイトなら `https://m365url.mnoda1979.chatgpt.site/`、独自運用なら自分の公開先URLです。末尾スラッシュまで一致させます。
3. サイトの認証設定にApplication (Client) ID、Directory (Tenant) ID、認証モードを入力します。Client Secretは不要です。
4. 必要なMicrosoft Graph委任アクセス許可を追加し、組織のポリシーに従って同意を取得します。

共通アプリのClient IDは`37c7505c-d9a8-4bad-b60e-93ec3575fc9c`、運営者Tenant IDは`9c9e5e5f-2563-4959-9cfd-54536047f126`です。マルチテナントでは`organizations`で認証し、運営者テナントを強制しません。シングルテナントにはGUID形式のTenant IDが必要です。サイト側のモード切替は登録アプリの対応アカウント設定を変更しません。

Redirect URIは現在のサイトのルートURLに限定しています。Webプラットフォーム認証は利用できません。SPAを選択してください。

## ダウンロードして自分のテナントで運用する

第三者もこのコードをダウンロード・改変して、自分のテナントで運用できます。GPLv3の条件は [LICENSE](LICENSE) を確認してください。同梱のMSALには別途MITライセンスが適用され、`dist/vendor/MSAL-LICENSE` に収録しています。

1. GitHubの「Code → Download ZIP」で取得するか、次のコマンドで複製します。

   ```sh
   git clone https://github.com/firstsuccess/m365url.git
   cd m365url
   ```

2. 自分のテナントでEntraアプリを登録します。組織内専用ならシングルテナントを選びます。上記「Microsoft Graph アクセス許可」のうち、利用する機能の委任権限を追加します。アプリケーション権限やClient Secretは不要です。同意は自組織のポリシーに従って取得してください。運営者側の同意が別テナントへ引き継がれることはありません。
3. HTTPSで公開するサイトのルートURLを決め、EntraアプリのSPAリダイレクトURIに登録します。ルート `/` での配信を想定しており、サブディレクトリ配信は対応していません。
4. `dist/auth.js` の `defaults` を自分の設定に変更します。

   ```js
   export const defaults = Object.freeze({
     clientId: '自分のApplication (Client) ID（GUID）',
     tenantId: '自分のDirectory (Tenant) ID（GUID）',
     mode: 'single',
     redirectUri: 'https://自分の公開先ドメイン/',
     platform: 'SPA'
   });
   ```

   リポジトリの既定値は運営者の共通アプリ用です。独立運用では必ず自分の値に置き換えてください。画面の「認証設定」でも変更できますが、その変更は利用中のブラウザにのみ適用されます。既に設定を保存したブラウザでは「保存設定を削除」後に再読み込みし、新しい既定値を利用してください。他組織にも提供する場合は、Entraアプリの対応アカウント設定と `mode: 'multi'` を合わせます。
5. 静的ホスティングには `dist/` 直下のHTML・JS・CSSと `vendor/` を配置します。`dist/server/` と `dist/.openai/` はSites公開用なので、通常の静的配信には不要です。ブラウザ用ファイルのビルドやnpm依存関係のインストールは不要です。

### ローカル確認とアクセスカウンター

Node.jsが使える環境では、リポジトリのルートで `node internal/preview.mjs` を実行して `http://127.0.0.1:8080/` を開けます。ローカルでGraph認証も確認する場合は、このURLをSPAリダイレクトURIに追加し、画面の認証設定にも同じURLを指定してください。`node tests/core.mjs` で基本チェックを実行できます。Graph・認証テストはモックであり、自分のテナントでの動作は別途確認が必要です。

アクセスカウンターは任意機能です。現行のSites公開版はCloudflare WorkerとD1の `DB` バインディングを使い、`drizzle/0000_visits.sql` にスキーマを定義しています。通常の静的配信では `/api/visit` を用意しなくても解析・認証機能を利用でき、カウンターは表示されません。リクエスト自体も不要なら `dist/app.js` 末尾のカウンター処理を削除してください。

Sitesで別サイトとして公開する場合、`.openai/hosting.json` と生成済みの `dist/.openai/hosting.json` に含まれる運営者のSite IDを流用せず、自分のSiteの設定を使ってください。`internal/package.mjs` はSites専用の公開パッケージ作成処理であり、一般的な静的ホスティングには不要です。

## Microsoft Graph アクセス許可

| 対象 | 委任アクセス許可 |
| --- | --- |
| SharePoint共有リンク照会 | Files.ReadWrite |
| SharePoint直接パス・サイト照会 | Sites.Read.All |
| Teams基本情報 | Team.ReadBasic.All |
| チャネル情報 | Channel.ReadBasic.All |

共有リンクの照会には[Microsoft公式仕様](https://learn.microsoft.com/graph/api/shares-get?view=graph-rest-1.0)でFiles.ReadWriteが必要です。サイトはファイル内容の更新を行いません。同意の可否は管理者のポリシーに依存し、本人がアクセスできる範囲のみ取得できます。

## Power Automateで利用する

TeamsアクションではTeam ID・Channel IDなどを、SharePointのパス指定アクションではSite AddressとSite Relative Pathを確認します。表示名とライブラリのURLパスは異なる場合があります。

Graph DriveItem ID、SharePoint ListItem ID、SharePointコネクタのFile Identifierは別の値です。File Identifierは「パスによるファイルメタデータの取得」のIdentifier出力を使用してください。未取得の識別子を代用しないでください。

## サインインとプライバシー

基本解析はブラウザ内で処理します。詳細照会時のみMicrosoftに対象URLを送信します。入力URLはサイトのデータベースに保存しません。照会後にサイト側のトークンとアカウントキャッシュを破棄し、Microsoft 365のサインイン状態は維持します。キャッシュの破棄は発行済みトークンの即時失効ではありません。

設定は通常保存されません。「設定を保存」を選んだ場合のみ公開設定をブラウザに保存します。「保存設定を削除」で削除できます。共有端末では保存を避けてください。

## よくある認証エラー

- AADSTS50011：SPAに登録したRedirect URIとの完全一致を確認してください。
- AADSTS700016：Client ID、認証先テナント、登録アプリの対応アカウントを確認してください。
- 403：リソースへのアクセス権、委任アクセス許可、管理者同意を確認してください。
- 404：ファイルの移動・削除や共有リンクの失効を確認してください。
- 429：時間をおいて再試行してください。

詳細照会ボタンを押すとポップアップでサインインします。既存のMicrosoftサインインセッションを利用できる場合もあります。ポップアップを許可し、MFA・条件付きアクセスの案内に従ってください。エラーには失敗段階・エラーコード、GraphエラーではHTTPステータス・APIの種類・取得できたRequest IDを表示します。

## English

Paste a Microsoft 365 URL and select Analyze URL. Basic analysis runs locally without sign-in. Graph lookups support organizational Teams and SharePoint resources. Personal OneDrive supports basic analysis only. Register the exact site root URL as a SPA redirect URI; no Client Secret is required. Sharing link lookups request Files.ReadWrite; Teams requests Team.ReadBasic.All and Channel.ReadBasic.All. Administrator consent may be required. URL-derived values are unverified. Graph DriveItem ID is not a SharePoint connector File Identifier. After a lookup, this site clears its authentication cache while preserving your Microsoft 365 sign-in.

## 简体中文

粘贴 Microsoft 365 链接并选择分析。基本分析在浏览器内完成，无需登录。Graph 查询支持组织帐户的 Teams 和 SharePoint。个人 OneDrive 仅支持基本分析。请将网站根 URL 完整注册为 SPA Redirect URI，无需 Client Secret。共享链接查询需要 Files.ReadWrite；Teams 需要 Team.ReadBasic.All 和 Channel.ReadBasic.All，可能需要管理员同意。URL 提取值未经确认。Graph DriveItem ID 不是 SharePoint 连接器的 File Identifier。查询后清除此网站的身份验证缓存，保留 Microsoft 365 登录状态。
