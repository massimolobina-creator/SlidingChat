
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NearbyUser, Coordinates } from '../types';

interface MapViewProps {
  coords: Coordinates;
  nearbyUsers: NearbyUser[];
  onUserClick: (user: NearbyUser) => void;
  onRetroactiveClick?: (checkIn: import('../types').RetroactiveCheckIn) => void;
  onMapClick?: (coords: Coordinates) => void;
  isOnline: boolean;
  currentLocationLabel: string;
  unreadCounts: Record<string, number>;
  retroactiveCheckIns?: import('../types').RetroactiveCheckIn[];
  language?: string;
}

const LOCALIZED_MAP: Record<string, { openChat: string; details: string }> = {
  English: { openChat: 'Open Chat', details: 'Details' },
  Italian: { openChat: 'Apri Chat', details: 'Dettagli' },
  Spanish: { openChat: 'Abrir Chat', details: 'Detalles' },
  French: { openChat: 'Ouvrir le chat', details: 'Détails' },
  German: { openChat: 'Chat öffnen', details: 'Details' },
  Portuguese: { openChat: 'Abrir chat', details: 'Detalhes' },
  Chinese: { openChat: '打开聊天', details: '详情' },
  Japanese: { openChat: 'チャットを開く', details: '詳細' },
  Russian: { openChat: 'Открыть чат', details: 'Детали' },
  Arabic: { openChat: 'افتح الدردشة', details: 'التفاصيل' },
  Hindi: { openChat: 'चैट खोलें', details: 'विवरण' }
};

export const MapView: React.FC<MapViewProps> = ({ 
    coords, nearbyUsers, onUserClick, onRetroactiveClick, onMapClick, isOnline, currentLocationLabel, unreadCounts, retroactiveCheckIns = [], language = 'English' 
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([coords.lat, coords.lng], 15);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);
    } else {
        mapRef.current.setView([coords.lat, coords.lng], 15);
    }
  }, []); 

  // Handle Map Clicks (External)
  useEffect(() => {
    if (!mapRef.current) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    mapRef.current.on('click', handleClick);
    return () => {
      mapRef.current?.off('click', handleClick);
    };
  }, [onMapClick]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;
    console.log("MapView: Updating markers, users:", nearbyUsers.length, "retroactive:", retroactiveCheckIns.length);

    // Clear existing
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Custom Icon Creator
    const createIcon = (color: string, isPulse: boolean = false, unreadCount: number = 0) => {
        
        // Very prominent envelope icon
        const envelopeHTML = unreadCount > 0 ? `
            <div class="absolute -top-6 -right-5 z-[999] bg-red-600 text-white rounded-lg px-1.5 py-0.5 shadow-2xl border-2 border-white flex items-center justify-center transform scale-110">
                <svg class="w-5 h-5 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                <span class="ml-1 text-xs font-bold">${unreadCount}</span>
            </div>
        ` : '';

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="relative flex items-center justify-center w-8 h-8 hover:scale-110 transition-transform">
                    ${isPulse ? `<div class="absolute w-full h-full bg-${color}-500 rounded-full animate-ping opacity-75"></div>` : ''}
                    <div class="relative w-7 h-7 bg-${color}-500 border-2 border-white rounded-full shadow-lg z-10"></div>
                    <div class="absolute -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-${color}-500"></div>
                    ${envelopeHTML}
                </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });
    };

    const renderMarkersWithDeclutter = () => {
        const markersToRender: { id: string; lat: number; lng: number; type: 'me' | 'user' | 'retro'; data?: any }[] = [];
        
        // Add Me
        markersToRender.push({ id: 'me', lat: coords.lat, lng: coords.lng, type: 'me' });

        // Add Others
        if (isOnline) {
            nearbyUsers.forEach(user => {
                if (user.status === 'offline') return;
                markersToRender.push({ id: user.id, lat: user.coords.lat, lng: user.coords.lng, type: 'user', data: user });
            });
        }

        // Add Retroactive
        retroactiveCheckIns.forEach(checkIn => {
            markersToRender.push({ id: checkIn.id, lat: checkIn.coords.lat, lng: checkIn.coords.lng, type: 'retro', data: checkIn });
        });

        const groups: Record<string, typeof markersToRender> = {};
        const PROXIMITY_THRESHOLD = 0.0002;

        markersToRender.forEach(m => {
            let placed = false;
            for (const key in groups) {
                const [gLat, gLng] = key.split(',').map(Number);
                const dist = Math.sqrt(Math.pow(m.lat - gLat, 2) + Math.pow(m.lng - gLng, 2));
                if (dist < PROXIMITY_THRESHOLD) {
                    groups[key].push(m);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                groups[`${m.lat},${m.lng}`] = [m];
            }
        });

        Object.values(groups).forEach(group => {
            const count = group.length;
            
            group.forEach((item, index) => {
                let finalLat = item.lat;
                let finalLng = item.lng;

                if (count > 1) {
                    const angle = (index / count) * Math.PI * 2;
                    const radius = 0.00025; 
                    finalLat = item.lat + Math.cos(angle) * radius;
                    finalLng = item.lng + Math.sin(angle) * radius;
                }

                if (item.type === 'me') {
                    const myMarker = L.marker([finalLat, finalLng], {
                        icon: createIcon('red', true),
                        zIndexOffset: 2000 
                    }).addTo(mapRef.current!);
                    
                    myMarker.bindPopup(`<div class="font-bold text-center">${currentLocationLabel}</div>`);
                    markersRef.current.push(myMarker);
                } else if (item.type === 'user') {
                    const user = item.data as NearbyUser;
                    const unread = unreadCounts[user.id] || 0;
                    
                    // Increase Z-Index if unread so the envelope is on top of everything
                    const zIndex = unread > 0 ? 1500 : 1000;

                    const marker = L.marker([finalLat, finalLng], {
                        icon: createIcon('green', false, unread),
                        zIndexOffset: zIndex
                    }).addTo(mapRef.current!);

                    marker.on('click', () => onUserClick(user));
                    
                    marker.bindTooltip(user.nickname, { 
                        permanent: false, 
                        direction: 'top',
                        offset: [0, -32],
                        className: 'px-2 py-1 bg-white text-xs font-bold rounded shadow'
                    });

                    markersRef.current.push(marker);
                } else if (item.type === 'retro') {
                    const checkIn = item.data as import('../types').RetroactiveCheckIn;
                    const dateStr = new Date(checkIn.timestamp).toLocaleString();

                    const marker = L.marker([finalLat, finalLng], {
                        icon: createIcon('purple', false),
                        zIndexOffset: 500
                    }).addTo(mapRef.current!);

                    const tPopup = LOCALIZED_MAP[language] || LOCALIZED_MAP['English'];
                    const captionHTML = checkIn.caption ? `<div class="mt-1 text-purple-600 italic border-t border-purple-100 pt-1">"${checkIn.caption}"</div>` : '';
                    const popupContent = `
                        <div class="p-1 min-w-[120px]">
                            <div class="font-bold text-gray-800">${checkIn.nickname}</div>
                            <div class="text-[10px] text-gray-500">${dateStr}</div>
                            ${captionHTML}
                            <button id="chat-btn-${checkIn.id}" class="mt-2 w-full bg-purple-600 text-white text-[10px] font-bold py-1 px-2 rounded hover:bg-purple-700 transition">
                                ${isOnline ? tPopup.openChat : tPopup.details}
                            </button>
                        </div>
                    `;

                    marker.bindPopup(popupContent, {
                        closeButton: false,
                        className: 'retroactive-popup'
                    });

                    marker.on('click', () => {
                        // If the popup is already open, the second click triggers the action
                        if (marker.getPopup()?.isOpen()) {
                            if (onRetroactiveClick) {
                                onRetroactiveClick(checkIn);
                            }
                        }
                    });

                    // Also handle the button click inside the popup
                    marker.on('popupopen', () => {
                        const btn = document.getElementById(`chat-btn-${checkIn.id}`);
                        if (btn) {
                            btn.onclick = (e) => {
                                e.stopPropagation();
                                if (onRetroactiveClick) {
                                    onRetroactiveClick(checkIn);
                                }
                            };
                        }
                    });

                    markersRef.current.push(marker);
                }
            });
        });
    };

    renderMarkersWithDeclutter();

  }, [coords, nearbyUsers, isOnline, onUserClick, onRetroactiveClick, currentLocationLabel, unreadCounts, retroactiveCheckIns]);

  return <div ref={containerRef} className="w-full h-full z-0" />;
};
