import type {
  CommandStyle,
  Em,
  HboxWidth,
  Line,
  Link,
  Color as MinitypeColor,
  Command as MinitypeCommand,
} from "@minitype/minitype";
import * as minitype from "@minitype/minitype";
import { collectInlineSegments, collectInlines } from "./children.js";
import type { InlineChildren, LineBreak } from "./jsx-runtime.js";

type InlineSegments =
  | minitype.InlineOrExtender
  | (minitype.InlineOrExtender | LineBreak)[];

// ------
// インライン要素
// ------

/**
 * インラインラップ系コンポーネント（{@link B}，{@link U} 等）の共通 Props．
 */
export interface InlineWrapProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
}

/**
 * コマンド名を受け取り，インラインコマンドコンポーネントを生成する．
 */
const makeInlineCommand = (
  name: string,
): ((props: InlineWrapProps) => InlineSegments) => {
  return ({ children }: InlineWrapProps) => {
    return collectInlineSegments(children, (inlines) => ({
      type: "command",
      body: inlines,
      name,
    }));
  };
};

/**
 * 太字．
 */
export const B = makeInlineCommand("b");

/**
 * 上付き文字．
 */
export const Sup = makeInlineCommand("sup");

/**
 * 下付き文字．
 */
export const Sub = makeInlineCommand("sub");

/**
 * 下線．
 */
export const U = makeInlineCommand("u");

/**
 * 取り消し線．
 */
export const Del = makeInlineCommand("del");

/**
 * {@link Color} コンポーネントの Props．
 */
export interface ColorProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** 文字色．*/
  value: MinitypeColor;
}

/**
 * 文字色．
 */
export const Color = ({ children, value }: ColorProps): InlineSegments => {
  return collectInlineSegments(children, (inlines) => ({
    type: "command",
    body: inlines,
    style: { effects: [minitype.fill(value)] },
  }));
};

/**
 * {@link FontSize} コンポーネントの Props．
 */
export interface FontSizeProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** 文字サイズ（pt）．*/
  size: number;
}

/**
 * 文字サイズ．
 */
export const FontSize = ({ children, size }: FontSizeProps): InlineSegments => {
  return collectInlineSegments(children, (inlines) => ({
    type: "command",
    body: inlines,
    style: { size },
  }));
};

/**
 * {@link Scale} コンポーネントの Props．
 */
export interface ScaleProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** スケール係数．*/
  factor: Em;
}

/**
 * 文字スケール．
 */
export const Scale = ({ children, factor }: ScaleProps): InlineSegments => {
  return collectInlineSegments(children, (inlines) => ({
    type: "command",
    body: inlines,
    style: { scale: factor },
  }));
};

/**
 * {@link Overline} コンポーネントの Props．
 */
export interface OverlineProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** 上線スタイル．*/
  line: Line;
}

/**
 * 上線．
 */
export const Overline = ({ children, line }: OverlineProps): InlineSegments => {
  return collectInlineSegments(children, (inlines) => ({
    type: "command",
    body: inlines,
    style: { overline: line },
  }));
};

/**
 * {@link Ruby} コンポーネントの Props．
 */
export interface RubyProps {
  /** ルビテキスト．*/
  ruby: string;
  /** ベーステキスト．*/
  children: string;
}

/**
 * ルビ．
 */
export const Ruby = ({
  ruby: rubyText,
  children,
}: RubyProps): minitype.Ruby => {
  const baseText = typeof children === "string" ? children : String(children);
  return {
    type: "ruby",
    base: baseText,
    ruby: rubyText,
  };
};

/**
 * {@link Url} コンポーネントの Props．
 */
export interface UrlProps {
  /** リンク先の URL．*/
  href: string;
  /** 表示テキスト（省略時は URL を表示）．*/
  children?: InlineChildren;
}

/**
 * ハイパーリンク．
 */
export const Url = ({ href, children }: UrlProps): InlineSegments => {
  return collectInlineSegments(children, (inlines) => ({
    type: "command",
    body: inlines.length > 0 ? inlines : [href],
    link: { type: "url", url: href },
  }));
};

/**
 * {@link Command} コンポーネントの Props．
 */
export interface CommandProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** コマンド名（`DocumentStyle.command` のキー）．*/
  name?: string;
  /** コマンドスタイル．*/
  style?: Partial<CommandStyle>;
  /** ラベル．*/
  label?: string;
  /** ID．*/
  id?: string;
  /** リンク．*/
  link?: Link;
}

/**
 * コマンド（汎用インライン装飾）．`DocumentStyle.command` に定義したスタイルを名前で適用する．
 */
export const Command = ({
  children,
  name,
  style,
  label,
  id,
  link,
}: CommandProps): InlineSegments => {
  return collectInlineSegments(
    children,
    (inlines): MinitypeCommand => ({
      type: "command",
      body: inlines,
      name,
      style,
      label,
      id,
      link,
    }),
  );
};

// ------
// インライングラフィック・数式
// ------

/**
 * {@link InlineGraphic} コンポーネントの Props．
 */
export interface InlineGraphicProps {
  /** 画像ファイルのパス．*/
  src: string;
  /** 画像サイズ．*/
  size?: number | Em;
  /** ブロック方向のオフセット．*/
  blockOffset?: number | Em;
  /** PDF のページ番号．*/
  page?: number;
}

/**
 * インライングラフィック．
 */
export const InlineGraphic = ({
  src,
  size,
  blockOffset,
  page,
}: InlineGraphicProps): minitype.InlineGraphic => {
  return {
    type: "graphic",
    src,
    size,
    blockOffset,
    page,
  };
};

/**
 * {@link InlineMath} コンポーネントの Props．
 */
export interface InlineMathProps {
  /** LaTeX 数式文字列．*/
  latex: string;
  /** 数式サイズ．*/
  size?: number | Em;
}

/**
 * インライン数式（LaTeX）．
 */
export const InlineMath = ({
  latex,
  size,
}: InlineMathProps): minitype.InlineMath => {
  return {
    type: "inline-math",
    latex,
    size,
  };
};

/**
 * {@link Hbox} コンポーネントの Props．
 */
export interface HboxProps {
  /** 子要素（インライン）．*/
  children?: InlineChildren;
  /** ボックス幅．*/
  width: HboxWidth;
  /** 塗りつぶし文字．*/
  fill?: string;
  /** 水平配置．*/
  align?: "left" | "center" | "right" | "justify";
}

/**
 * 水平ボックス（固定幅のインラインコンテナ）．
 */
export const Hbox = ({
  children,
  width,
  fill,
  align,
}: HboxProps): minitype.Hbox => {
  if (fill !== undefined) {
    return {
      type: "hbox",
      blockSize: width,
      fill,
      align,
    };
  }
  return {
    type: "hbox",
    blockSize: width,
    body: collectInlines(children),
    align,
  };
};
