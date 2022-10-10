import XDot from "~/components/XDot";

export default function Spinner() {
  return (
    <div className="w-full pt-20 opacity-50">
      <div className="mx-auto animate-ping block w-fit">
        <XDot className="w-8" />
      </div>
    </div>
  );
}
