import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Facebook, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  type: 'trade' | 'position' | 'prediction';
  marketTitle: string;
  outcome: string;
  price?: string;
  shares?: string;
  pnl?: string;
  side?: string;
  marketId?: string;
}

export function ShareButton({ type, marketTitle, outcome, price, shares, pnl, side, marketId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareText = () => {
    const appName = "PolyTrade";
    let text = "";
    
    if (type === 'trade') {
      text = `I just ${side === 'BUY' ? 'bought' : 'sold'} ${shares} ${outcome} shares on "${marketTitle}" at $${price} on ${appName}!`;
    } else if (type === 'position') {
      const pnlNum = pnl ? parseFloat(pnl) : 0;
      const pnlText = pnlNum >= 0 ? `+$${pnlNum.toFixed(2)}` : `-$${Math.abs(pnlNum).toFixed(2)}`;
      text = `My ${outcome} position on "${marketTitle}": ${shares} shares, P/L: ${pnlText} on ${appName}!`;
    } else {
      text = `Check out this prediction market: "${marketTitle}" - I'm betting ${outcome} on ${appName}!`;
    }
    
    return text;
  };

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (marketId) {
      return `${origin}/market/${marketId}`;
    }
    return window.location.href;
  };

  const shareUrl = getShareUrl();
  const shareText = generateShareText();

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" data-testid="share-button">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={shareToTwitter} data-testid="share-twitter">
          <Twitter className="h-4 w-4 mr-2" />
          Share on X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} data-testid="share-facebook">
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} data-testid="share-copy-link">
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
          {copied ? "Copied!" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
