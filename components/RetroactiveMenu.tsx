
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates, RetroactiveCheckIn } from '../types';

interface RetroactiveMenuProps {
  initialCoords: Coordinates;
  onAdd: (coords: Coordinates, timestamp: number) => void;
  onUpdate?: (id: string, coords: Coordinates, timestamp: number) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  language: string;
  editingCheckIn?: RetroactiveCheckIn;
}

const TRANSLATIONS: Record<string, any> = {
  English: {
    title: "Retroactive Check-in",
    titleEdit: "Edit Memory",
    subtitle: "Where and when did you cross paths?",
    dateLabel: "Date",
    timeLabel: "Time",
    locationLabel: "Location",
    locationHint: "Tap on the map or drag the marker",
    captionLabel: "Caption",
    captionPlaceholder: "Add a short description (e.g., 'I was wearing a red hat')",
    submit: "Post Memory",
    manualPlacement: "Place on Main Map",
    update: "Update Memory",
    delete: "Remove",
    cancel: "Cancel"
  },
  Italian: {
    title: "Geolocalizzazione Retroattiva",
    titleEdit: "Modifica Ricordo",
    subtitle: "Dove e quando vi siete incrociati?",
    dateLabel: "Data",
    timeLabel: "Ora",
    locationLabel: "Posizione",
    locationHint: "Tocca sulla mappa o trascina il segnaposto",
    captionLabel: "Didascalia",
    captionPlaceholder: "Aggiungi una breve descrizione (es. 'Indossavo un cappello rosso')",
    submit: "Pubblica Ricordo",
    manualPlacement: "Posiziona sulla Mappa Principale",
    update: "Aggiorna Ricordo",
    delete: "Rimuovi",
    cancel: "Annulla"
  }
};

interface RetroactiveMenuProps {
  initialCoords: Coordinates;
  onAdd: (coords: Coordinates, timestamp: number, caption?: string) => void;
  onUpdate?: (id: string, coords: Coordinates, timestamp: number, caption?: string) => void;
  onDelete?: (id: string) => void;
  onManualPlacement?: (timestamp: number, caption?: string) => void;
  onClose: () => void;
  language: string;
  editingCheckIn?: RetroactiveCheckIn;
}

export const RetroactiveMenu: React.FC<RetroactiveMenuProps> = ({ 
  initialCoords, onAdd, onUpdate, onDelete, onManualPlacement, onClose, language, editingCheckIn 
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['English'];
  
  const [coords, setCoords] = useState<Coordinates>(editingCheckIn?.coords || initialCoords);
  const [date, setDate] = useState(
    editingCheckIn 
      ? new Date(editingCheckIn.timestamp).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(
    editingCheckIn 
      ? new Date(editingCheckIn.timestamp).toTimeString().slice(0, 5) 
      : new Date().toTimeString().slice(0, 5)
  );
  const [caption, setCaption] = useState(editingCheckIn?.caption || '');
  
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const startCoords = editingCheckIn?.coords || initialCoords;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([startCoords.lat, startCoords.lng], 16);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);

      markerRef.current = L.marker([startCoords.lat, startCoords.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <div class="relative w-7 h-7 bg-purple-500 border-2 border-white rounded-full shadow-lg z-10"></div>
                <div class="absolute -bottom-2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-purple-500"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        })
      }).addTo(mapRef.current);

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
      });

      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });
        markerRef.current!.setLatLng([lat, lng]);
      });
    }
  }, [initialCoords, editingCheckIn]);

  const handleSubmit = () => {
    const timestamp = new Date(`${date}T${time}`).getTime();
    if (editingCheckIn && onUpdate) {
      onUpdate(editingCheckIn.id, coords, timestamp, caption);
    } else {
      onAdd(coords, timestamp, caption);
    }
  };

  const handleDelete = () => {
    if (editingCheckIn && onDelete && confirm(language === 'Italian' ? 'Rimuovere questo ricordo?' : 'Remove this memory?')) {
      onDelete(editingCheckIn.id);
    }
  };

  const handleManualPlacement = () => {
    const timestamp = new Date(`${date}T${time}`).getTime();
    if (onManualPlacement) {
      onManualPlacement(timestamp, caption);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-5 sm:p-6 text-white shrink-0 ${editingCheckIn ? 'bg-indigo-600' : 'bg-purple-600'}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{editingCheckIn ? t.titleEdit : t.title}</h2>
              <p className={`${editingCheckIn ? 'text-indigo-100' : 'text-purple-100'} text-xs sm:text-sm`}>{t.subtitle}</p>
            </div>
            {!editingCheckIn && (
              <button 
                onClick={handleManualPlacement}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition text-[10px] sm:text-xs font-bold flex items-center gap-1"
                title={t.manualPlacement}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="hidden xs:inline">{t.manualPlacement}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 sm:space-y-6">
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.dateLabel}</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.timeLabel}</label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 sm:p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition text-sm"
              />
            </div>
          </div>

          {/* Map Picker */}
          <div className="flex flex-col shrink-0 min-h-[180px]">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.locationLabel}</label>
            <p className="text-[10px] text-gray-400 mb-2">{t.locationHint}</p>
            <div ref={containerRef} className="w-full h-[180px] rounded-2xl border border-gray-200 shadow-inner z-0" />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.captionLabel}</label>
            <textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t.captionPlaceholder}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-500 transition text-sm resize-none h-20"
              maxLength={150}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 sm:gap-3 shrink-0 pb-safe">
          <button 
            onClick={onClose}
            className="flex-1 min-w-[80px] py-2.5 sm:py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 transition text-sm"
          >
            {t.cancel}
          </button>
          
          {editingCheckIn && (
            <button 
              onClick={handleDelete}
              className="flex-1 min-w-[80px] py-2.5 sm:py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition border border-red-100 text-sm"
            >
              {t.delete}
            </button>
          )}

          <button 
            onClick={handleSubmit}
            className={`flex-[2] min-w-[120px] py-2.5 sm:py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 text-sm ${
              editingCheckIn 
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
            }`}
          >
            {editingCheckIn ? t.update : t.submit}
          </button>
        </div>

      </div>
    </div>
  );
};
