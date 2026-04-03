// ─── Flight Categories & Aircraft Types (Egypt Civil Aircraft) ─────────────

export interface AircraftCategory {
    key: string
    label: string
    emoji: string
    aircraft: string[]
}

export const FLIGHT_CATEGORIES: AircraftCategory[] = [
    {
        key: 'commercial',
        label: 'Commercial Passenger',
        emoji: '🟢',
        aircraft: [
            'Airbus A220-300',
            'Airbus A320-200',
            'Airbus A320neo',
            'Airbus A321-200',
            'Airbus A321neo',
            'Boeing 737-800',
            'Boeing 737-8 MAX',
            'Airbus A330-200',
            'Airbus A330-300',
            'Boeing 777-300ER',
            'Boeing 787-9 Dreamliner',
            'Airbus A350-900',
        ],
    },
    {
        key: 'cargo',
        label: 'Cargo (Freighters)',
        emoji: '📦',
        aircraft: [
            'Airbus A330-200F',
            'Boeing 737-800BCF',
        ],
    },
    {
        key: 'private',
        label: 'Private / Business Jets',
        emoji: '🛩',
        aircraft: [
            'Gulfstream G450',
            'Gulfstream G550',
            'Gulfstream G650',
            'Bombardier Challenger 604',
            'Bombardier Challenger 605',
            'Bombardier Global 6000',
            'Dassault Falcon 7X',
            'Dassault Falcon 8X',
        ],
    },
    {
        key: 'training',
        label: 'Training Aircraft',
        emoji: '🎓',
        aircraft: [
            'Cessna 152',
            'Cessna 172',
            'Diamond DA40',
            'Diamond DA42',
        ],
    },
    {
        key: 'helicopter',
        label: 'Helicopters (Civil Use)',
        emoji: '🚁',
        aircraft: [
            'Bell 206',
            'Bell 407',
            'Airbus H125',
            'Leonardo AW139',
        ],
    },
]

export function getAircraftByCategory(categoryKey: string): string[] {
    const cat = FLIGHT_CATEGORIES.find(c => c.key === categoryKey)
    return cat ? cat.aircraft : []
}
