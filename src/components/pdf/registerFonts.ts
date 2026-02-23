/**
 * フォント登録モジュール
 * Font.register() は複数の PDF コンポーネントから同じフォントファミリーを
 * 登録すると BindingError が発生するため、このファイルで一元管理する。
 * 各 PDF コンポーネントはこのファイルを import するだけでよい。
 */
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Noto Sans JP",
    fonts: [
      {
        src: "https://raw.githubusercontent.com/google/fonts/main/ofl/mplus1p/MPLUS1p-Regular.ttf",
        fontWeight: 400,
      },
      {
        src: "https://raw.githubusercontent.com/google/fonts/main/ofl/mplus1p/MPLUS1p-Bold.ttf",
        fontWeight: 700,
      },
    ],
  });
}
