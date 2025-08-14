import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OnlineIndicatorProps {
  isOnline: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineIndicator({ 
  isOnline, 
  showBadge = false,
  size = 'md',
  className 
}: OnlineIndicatorProps) {
  // Determine the size of the dot
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  const dotSize = dotSizes[size];
  
  if (!isOnline) {
    return null;
  }
  
  return (
    <>
      <span 
        className={cn(
          "absolute bottom-0 right-0 rounded-full bg-green-500 ring-2 ring-background", 
          dotSize,
          className
        )} 
      />
      
      {showBadge && (
        <Badge 
          variant="outline" 
          className="ml-2 h-5 text-xs bg-green-500/10 text-green-500 border-green-500/20"
        >
          Online
        </Badge>
      )}
    </>
  );
} 