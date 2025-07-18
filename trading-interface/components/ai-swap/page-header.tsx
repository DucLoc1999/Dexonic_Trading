import { useAppLayoutContext } from "@/context/AppLayoutContext";

interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  const { headerSlot } = useAppLayoutContext();

  return headerSlot ? <span className="font-medium">{title}</span> : null;
}
