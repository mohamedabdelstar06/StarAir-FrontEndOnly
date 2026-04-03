// ─── World Aerodromes (ICAO codes + names) ────────────────────────────
// Comprehensive list of major aerodromes worldwide for origin/destination dropdowns

export interface Aerodrome {
    icao: string
    iata: string
    name: string
    city: string
    country: string
}

export const AERODROMES: Aerodrome[] = [
    // ─── Egypt ──────────────────────────────────────────────────────
    { icao: 'HECA', iata: 'CAI', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt' },
    { icao: 'HEGN', iata: 'HRG', name: 'Hurghada International Airport', city: 'Hurghada', country: 'Egypt' },
    { icao: 'HESH', iata: 'SSH', name: 'Sharm El-Sheikh International Airport', city: 'Sharm El-Sheikh', country: 'Egypt' },
    { icao: 'HELX', iata: 'LXR', name: 'Luxor International Airport', city: 'Luxor', country: 'Egypt' },
    { icao: 'HEAS', iata: 'ASW', name: 'Aswan International Airport', city: 'Aswan', country: 'Egypt' },
    { icao: 'HEAL', iata: 'HBE', name: 'Borg El Arab Airport', city: 'Alexandria', country: 'Egypt' },
    { icao: 'HEAX', iata: 'ALY', name: 'El Nouzha Airport', city: 'Alexandria', country: 'Egypt' },
    { icao: 'HEBA', iata: 'ACE', name: 'New Administrative Capital Airport', city: 'New Capital', country: 'Egypt' },
    { icao: 'HEMM', iata: 'RMF', name: 'Marsa Alam International Airport', city: 'Marsa Alam', country: 'Egypt' },
    { icao: 'HESN', iata: 'AAC', name: 'El Arish International Airport', city: 'El Arish', country: 'Egypt' },
    { icao: 'HESG', iata: 'SQK', name: 'Sohag International Airport', city: 'Sohag', country: 'Egypt' },
    { icao: 'HEAT', iata: 'ATZ', name: 'Asyut Airport', city: 'Asyut', country: 'Egypt' },
    { icao: 'HETB', iata: 'TCP', name: 'Taba International Airport', city: 'Taba', country: 'Egypt' },
    { icao: 'HEPS', iata: 'PSD', name: 'Port Said Airport', city: 'Port Said', country: 'Egypt' },

    // ─── Middle East ────────────────────────────────────────────────
    { icao: 'OMDB', iata: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
    { icao: 'OMDW', iata: 'DWC', name: 'Al Maktoum International Airport', city: 'Dubai', country: 'UAE' },
    { icao: 'OMAA', iata: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'UAE' },
    { icao: 'OMSJ', iata: 'SHJ', name: 'Sharjah International Airport', city: 'Sharjah', country: 'UAE' },
    { icao: 'OTHH', iata: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
    { icao: 'OEJN', iata: 'JED', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia' },
    { icao: 'OERK', iata: 'RUH', name: 'King Khalid International Airport', city: 'Riyadh', country: 'Saudi Arabia' },
    { icao: 'OEDF', iata: 'DMM', name: 'King Fahd International Airport', city: 'Dammam', country: 'Saudi Arabia' },
    { icao: 'OEMA', iata: 'MED', name: 'Prince Mohammad bin Abdulaziz Airport', city: 'Medina', country: 'Saudi Arabia' },
    { icao: 'OBBI', iata: 'BAH', name: 'Bahrain International Airport', city: 'Manama', country: 'Bahrain' },
    { icao: 'OKBK', iata: 'KWI', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait' },
    { icao: 'OOMS', iata: 'MCT', name: 'Muscat International Airport', city: 'Muscat', country: 'Oman' },
    { icao: 'ORBI', iata: 'BGW', name: 'Baghdad International Airport', city: 'Baghdad', country: 'Iraq' },
    { icao: 'OIIE', iata: 'IKA', name: 'Imam Khomeini International Airport', city: 'Tehran', country: 'Iran' },
    { icao: 'OJAM', iata: 'AMM', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan' },
    { icao: 'OLBA', iata: 'BEY', name: 'Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon' },
    { icao: 'LLBG', iata: 'TLV', name: 'Ben Gurion International Airport', city: 'Tel Aviv', country: 'Israel' },

    // ─── North Africa ───────────────────────────────────────────────
    { icao: 'DTTA', iata: 'TUN', name: 'Tunis-Carthage International Airport', city: 'Tunis', country: 'Tunisia' },
    { icao: 'DAAG', iata: 'ALG', name: 'Houari Boumediene Airport', city: 'Algiers', country: 'Algeria' },
    { icao: 'GMMN', iata: 'CMN', name: 'Mohammed V International Airport', city: 'Casablanca', country: 'Morocco' },
    { icao: 'GMME', iata: 'RBA', name: 'Rabat-Sale Airport', city: 'Rabat', country: 'Morocco' },
    { icao: 'GMFF', iata: 'FEZ', name: 'Fes-Saiss Airport', city: 'Fez', country: 'Morocco' },
    { icao: 'GMMX', iata: 'RAK', name: 'Marrakech Menara Airport', city: 'Marrakech', country: 'Morocco' },
    { icao: 'HLLT', iata: 'TIP', name: 'Tripoli International Airport', city: 'Tripoli', country: 'Libya' },
    { icao: 'HLLB', iata: 'BEN', name: 'Benina International Airport', city: 'Benghazi', country: 'Libya' },
    { icao: 'HSSS', iata: 'KRT', name: 'Khartoum International Airport', city: 'Khartoum', country: 'Sudan' },

    // ─── Sub-Saharan Africa ─────────────────────────────────────────
    { icao: 'HAAB', iata: 'ADD', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia' },
    { icao: 'HKJK', iata: 'NBO', name: 'Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya' },
    { icao: 'HTDA', iata: 'DAR', name: 'Julius Nyerere International Airport', city: 'Dar es Salaam', country: 'Tanzania' },
    { icao: 'FAOR', iata: 'JNB', name: 'O.R. Tambo International Airport', city: 'Johannesburg', country: 'South Africa' },
    { icao: 'FACT', iata: 'CPT', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa' },
    { icao: 'FALA', iata: 'HLA', name: 'Lanseria International Airport', city: 'Johannesburg', country: 'South Africa' },
    { icao: 'DNMM', iata: 'LOS', name: 'Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria' },
    { icao: 'DNAA', iata: 'ABV', name: 'Nnamdi Azikiwe International Airport', city: 'Abuja', country: 'Nigeria' },
    { icao: 'DGAA', iata: 'ACC', name: 'Kotoka International Airport', city: 'Accra', country: 'Ghana' },
    { icao: 'FMEE', iata: 'RUN', name: 'Roland Garros Airport', city: 'Saint-Denis', country: 'Réunion' },
    { icao: 'GOOY', iata: 'DSS', name: 'Blaise Diagne International Airport', city: 'Dakar', country: 'Senegal' },

    // ─── Europe ─────────────────────────────────────────────────────
    { icao: 'EGLL', iata: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
    { icao: 'EGLC', iata: 'LCY', name: 'London City Airport', city: 'London', country: 'United Kingdom' },
    { icao: 'EGKK', iata: 'LGW', name: 'London Gatwick Airport', city: 'London', country: 'United Kingdom' },
    { icao: 'EGSS', iata: 'STN', name: 'London Stansted Airport', city: 'London', country: 'United Kingdom' },
    { icao: 'EGBB', iata: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'United Kingdom' },
    { icao: 'EGCC', iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'United Kingdom' },
    { icao: 'LFPG', iata: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
    { icao: 'LFPO', iata: 'ORY', name: 'Paris Orly Airport', city: 'Paris', country: 'France' },
    { icao: 'LFML', iata: 'MRS', name: 'Marseille Provence Airport', city: 'Marseille', country: 'France' },
    { icao: 'LFMN', iata: 'NCE', name: 'Nice Côte d\'Azur Airport', city: 'Nice', country: 'France' },
    { icao: 'EDDF', iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
    { icao: 'EDDM', iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
    { icao: 'EDDB', iata: 'BER', name: 'Berlin Brandenburg Airport', city: 'Berlin', country: 'Germany' },
    { icao: 'EDDL', iata: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany' },
    { icao: 'EHAM', iata: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands' },
    { icao: 'EBBR', iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
    { icao: 'LSZH', iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
    { icao: 'LSGG', iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland' },
    { icao: 'LOWW', iata: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria' },
    { icao: 'LIRF', iata: 'FCO', name: 'Leonardo da Vinci–Fiumicino Airport', city: 'Rome', country: 'Italy' },
    { icao: 'LIMC', iata: 'MXP', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy' },
    { icao: 'LEMD', iata: 'MAD', name: 'Madrid-Barajas Airport', city: 'Madrid', country: 'Spain' },
    { icao: 'LEBL', iata: 'BCN', name: 'Barcelona–El Prat Airport', city: 'Barcelona', country: 'Spain' },
    { icao: 'LPPT', iata: 'LIS', name: 'Lisbon Airport', city: 'Lisbon', country: 'Portugal' },
    { icao: 'LGAV', iata: 'ATH', name: 'Athens International Airport', city: 'Athens', country: 'Greece' },
    { icao: 'LTFM', iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
    { icao: 'LTAI', iata: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey' },
    { icao: 'LTBA', iata: 'ISL', name: 'Atatürk Airport', city: 'Istanbul', country: 'Turkey' },
    { icao: 'EKCH', iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
    { icao: 'ESSA', iata: 'ARN', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden' },
    { icao: 'ENGM', iata: 'OSL', name: 'Oslo Gardermoen Airport', city: 'Oslo', country: 'Norway' },
    { icao: 'EFHK', iata: 'HEL', name: 'Helsinki-Vantaa Airport', city: 'Helsinki', country: 'Finland' },
    { icao: 'EPWA', iata: 'WAW', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland' },
    { icao: 'LKPR', iata: 'PRG', name: 'Václav Havel Airport Prague', city: 'Prague', country: 'Czech Republic' },
    { icao: 'LHBP', iata: 'BUD', name: 'Budapest Ferenc Liszt Airport', city: 'Budapest', country: 'Hungary' },
    { icao: 'LROP', iata: 'OTP', name: 'Henri Coandă International Airport', city: 'Bucharest', country: 'Romania' },
    { icao: 'EIDW', iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
    { icao: 'LIRA', iata: 'CIA', name: 'Rome Ciampino Airport', city: 'Rome', country: 'Italy' },
    { icao: 'UUEE', iata: 'SVO', name: 'Sheremetyevo International Airport', city: 'Moscow', country: 'Russia' },
    { icao: 'UUDD', iata: 'DME', name: 'Domodedovo International Airport', city: 'Moscow', country: 'Russia' },
    { icao: 'ULLI', iata: 'LED', name: 'Pulkovo Airport', city: 'Saint Petersburg', country: 'Russia' },
    { icao: 'LCLK', iata: 'LCA', name: 'Larnaca International Airport', city: 'Larnaca', country: 'Cyprus' },

    // ─── Americas ───────────────────────────────────────────────────
    { icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
    { icao: 'KEWR', iata: 'EWR', name: 'Newark Liberty International Airport', city: 'Newark', country: 'United States' },
    { icao: 'KLGA', iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'United States' },
    { icao: 'KLAX', iata: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
    { icao: 'KORD', iata: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States' },
    { icao: 'KATL', iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States' },
    { icao: 'KDFW', iata: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States' },
    { icao: 'KDEN', iata: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'United States' },
    { icao: 'KSFO', iata: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
    { icao: 'KIAD', iata: 'IAD', name: 'Washington Dulles International Airport', city: 'Washington D.C.', country: 'United States' },
    { icao: 'KMIA', iata: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'United States' },
    { icao: 'KBOS', iata: 'BOS', name: 'Boston Logan International Airport', city: 'Boston', country: 'United States' },
    { icao: 'KSEA', iata: 'SEA', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States' },
    { icao: 'KPHL', iata: 'PHL', name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'United States' },
    { icao: 'CYYZ', iata: 'YYZ', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada' },
    { icao: 'CYUL', iata: 'YUL', name: 'Montréal-Trudeau International Airport', city: 'Montreal', country: 'Canada' },
    { icao: 'CYVR', iata: 'YVR', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada' },
    { icao: 'MMMX', iata: 'MEX', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico' },
    { icao: 'SBGR', iata: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'Brazil' },
    { icao: 'SBGL', iata: 'GIG', name: 'Rio de Janeiro/Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil' },
    { icao: 'SAEZ', iata: 'EZE', name: 'Ministro Pistarini International Airport', city: 'Buenos Aires', country: 'Argentina' },
    { icao: 'SCEL', iata: 'SCL', name: 'Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile' },
    { icao: 'SKBO', iata: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'Colombia' },
    { icao: 'SEQM', iata: 'UIO', name: 'Mariscal Sucre International Airport', city: 'Quito', country: 'Ecuador' },
    { icao: 'SPJC', iata: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'Peru' },

    // ─── Asia ───────────────────────────────────────────────────────
    { icao: 'VHHH', iata: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong' },
    { icao: 'WSSS', iata: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
    { icao: 'RJTT', iata: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' },
    { icao: 'RJAA', iata: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
    { icao: 'RKSI', iata: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
    { icao: 'ZBAD', iata: 'PKX', name: 'Beijing Daxing International Airport', city: 'Beijing', country: 'China' },
    { icao: 'ZSPD', iata: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China' },
    { icao: 'ZGGG', iata: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China' },
    { icao: 'VABB', iata: 'BOM', name: 'Chhatrapati Shivaji International Airport', city: 'Mumbai', country: 'India' },
    { icao: 'VIDP', iata: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India' },
    { icao: 'VOBL', iata: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore', country: 'India' },
    { icao: 'VTBS', iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
    { icao: 'WMKK', iata: 'KUL', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia' },
    { icao: 'WIII', iata: 'CGK', name: 'Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia' },
    { icao: 'RPLL', iata: 'MNL', name: 'Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines' },
    { icao: 'VVNB', iata: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam' },
    { icao: 'OPKC', iata: 'KHI', name: 'Jinnah International Airport', city: 'Karachi', country: 'Pakistan' },
    { icao: 'OPLA', iata: 'LHE', name: 'Allama Iqbal International Airport', city: 'Lahore', country: 'Pakistan' },
    { icao: 'VCBI', iata: 'CMB', name: 'Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka' },

    // ─── Oceania ─────────────────────────────────────────────────────
    { icao: 'YSSY', iata: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
    { icao: 'YMML', iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
    { icao: 'YBBN', iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
    { icao: 'NZAA', iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
]

/**
 * Search aerodromes by query (matches ICAO, IATA, city, name, country)
 */
export function searchAerodromes(query: string, limit = 20): Aerodrome[] {
    if (!query || query.length < 2) return AERODROMES.slice(0, limit)
    const q = query.toLowerCase()
    return AERODROMES.filter(a =>
        a.icao.toLowerCase().includes(q) ||
        a.iata.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    ).slice(0, limit)
}
