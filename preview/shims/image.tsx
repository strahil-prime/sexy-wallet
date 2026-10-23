import bella from "../../public/teller/bella.jpg";
import avatar from "../../public/teller/bella-avatar.jpg";
import backdrop from "../../public/backdrop.jpg";

const map: Record<string, string> = {
  "/teller/bella.jpg": bella,
  "/teller/bella-avatar.jpg": avatar,
  "/backdrop.jpg": backdrop,
};

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & { src: string; fill?: boolean; priority?: boolean };

export default function Image({ src, fill, priority, className, style, ...rest }: Props) {
  void priority;
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img
      src={map[src] ?? src}
      className={className}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
}
