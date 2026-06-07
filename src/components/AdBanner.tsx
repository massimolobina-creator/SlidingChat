
import React from 'react';

interface AdBannerProps {
  position: 'top' | 'bottom';
  adUnitId?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ position, adUnitId, className = "" }) => {
  // In a real AdMob web implementation (e.g. via AdSense or Ad Manager), 
  // you would inject a script or use a specific library here.
  // For now, we provide a styled placeholder that respects AdMob banner sizes (e.g. 320x50 or 728x90).
  
  return (
    <div 
      className={`w-full bg-gray-100 border-b border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all ${
        position === 'top' ? 'h-[60px]' : 'h-[50px] border-t border-b-0 fixed bottom-0 left-0 z-50'
      } ${className}`}
      id={`admob-banner-${position}`}
    >
      <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Advertisement</div>
      <div className="bg-gray-200 border border-dashed border-gray-300 px-4 py-1 rounded text-[11px] text-gray-500 font-mono">
        {adUnitId || 'ADMOB_BANNER_PLACEHOLDER'}
      </div>
      
      {/* 
          Note for the user: 
          To implement real AdMob/AdSense, you would typically add:
          <ins className="adsbygoogle"
               style={{display: 'block'}}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot={adUnitId}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
      */}
    </div>
  );
};
