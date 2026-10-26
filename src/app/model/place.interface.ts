export interface Place {
    name: string;
    lat: number;
    lon: number;
    id: string;
    kind: string;
    /**
     * Wo der Ort gespeichert ist. Die Angaben liegen bewusst am Ort selbst (denormalisiert),
     * damit eine Ansicht mit einem einzigen Dokument auskommt. Firestore kennt keine Joins.
     * - wishlist: auf der Merkliste
     * - trips: Reisen, in denen der Ort geplant ist, jeweils mit den geplanten Tagen
     */
    used_in?: {
      trips?: { 
      tripName: string; 
      plannedDates?: string[]; 
    }[]; 
      wishlist?: boolean; 
    };
    bbox?: number[];
    icon?: string;
  }