import { Dumbbell, Coffee, Building, Mic, Drama, Monitor, Video, Users } from 'lucide-react'
import type { ReactNode } from 'react'

export const COLLEGES: Record<string, string[]> = {
  'College of Criminal Justice Education': ['Bachelor of Science in Criminology'],
  'College of Engineering and Technology': [
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Mechanical Engineering',
    'Bachelor of Science in Electronics and Communication Engineering',
  ],
  'College of Hospitality & Tourism Management': [
    'Bachelor of Science in Hotel and Restaurant Management',
    'Bachelor of Science in Tourism Management',
  ],
  'College of Humanities, Social Sciences and Communication': [
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Nursing',
    'Bachelor of Arts in English',
    'Bachelor of Science in Biology',
    'Bachelor of Science in Chemistry',
  ],
  'College of Maritime Education': ['Bachelor of Science in Marine Transportation (BSMT)'],
  'School of Teacher Education': [
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
    'Bachelor of Physical Education',
  ],
  'School of Business & Management': [
    'Bachelor of Science in Accountancy',
    'Bachelor of Science in Business Administration',
    'Bachelor of Science in Management Accounting',
  ],
}

export const VENUES: { name: string; capacity: number; icon: ReactNode }[] = [
  { name: 'HCDC Gymnasium', capacity: 5000, icon: <Dumbbell className="w-5 h-5" /> },
  { name: 'Student Lounge', capacity: 300, icon: <Coffee className="w-5 h-5" /> },
  { name: 'Sedes Sapientiae', capacity: 1000, icon: <Building className="w-5 h-5" /> },
  { name: 'Function Hall', capacity: 150, icon: <Mic className="w-5 h-5" /> },
  { name: 'Cross Theatre', capacity: 300, icon: <Drama className="w-5 h-5" /> },
  { name: 'ITLAB', capacity: 40, icon: <Monitor className="w-5 h-5" /> },
  { name: 'SSG Studio', capacity: 50, icon: <Video className="w-5 h-5" /> },
  { name: 'Conference Room', capacity: 70, icon: <Users className="w-5 h-5" /> },
]

export const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer']

export const SCHOOL_YEARS = ['2024-2025', '2025-2026', '2026-2027', '2027-2028']

export const PREMADE_CERTIFICATES = [
  { name: 'HCDC-Wide', path: '/certificate templates/MAIN CERTIFICATE.png', department: 'HCDC-Wide Events' },
  { name: 'CCJE', path: '/certificate templates/CCJE.png', department: 'College of Criminal Justice Education' },
  { name: 'CET', path: '/certificate templates/CET.png', department: 'College of Engineering and Technology' },
  { name: 'CHATME', path: '/certificate templates/CHATME.png', department: 'College of Hospitality & Tourism Management' },
  { name: 'HUSOCOM', path: '/certificate templates/HUSOCOM.png', department: 'College of Humanities, Social Sciences and Communication' },
  { name: 'COME', path: '/certificate templates/COME.png', department: 'College of Maritime Education' },
  { name: 'SBME', path: '/certificate templates/SBME.png', department: 'School of Business & Management' },
  { name: 'STE', path: '/certificate templates/STE.png', department: 'School of Teacher Education' },
]

export const COORDINATE_DEFAULTS = {
  name: { x: 1000, y: 720 },
  eventTitle: { x: 900, y: 538 },
  date: { x: 1230, y: 538 },
}

export const CERTIFICATE_DIMENSION = { width: 2000, height: 1414 }

export const INITIAL_COORDINATES = {
  name: { ...COORDINATE_DEFAULTS.name },
  eventTitle: { ...COORDINATE_DEFAULTS.eventTitle },
  date: { ...COORDINATE_DEFAULTS.date },
}

export type CertificateCoordinates = typeof INITIAL_COORDINATES
