import { DecisionPreset } from '../types';

export const DECISION_PRESETS: DecisionPreset[] = [
  {
    id: 'career-change',
    title: 'Accept New Higher-Paying Job vs Stay at Current Company',
    context: 'The new job offers 25% higher salary, but requires 3 days in office and has unknown culture. Current role is fully remote, comfortable, but lower compensation.',
    options: ['Accept New Job Offer', 'Stay at Current Job', 'Negotiate Counteroffer at Current Job'],
    category: 'Career',
    icon: 'Briefcase',
  },
  {
    id: 'housing-rent-buy',
    title: 'Buy a Home Now vs Continue Renting and Investing',
    context: 'Interest rates are around 6.5%. Have saved enough for a 15% down payment. Unsure if buying now provides stability or locks up capital compared to index fund investing.',
    options: ['Buy a Home Now', 'Continue Renting & Invest Savings'],
    category: 'Finance',
    icon: 'Home',
  },
  {
    id: 'relocation-city',
    title: 'Move to a Major Tech Hub vs Stay in Hometown',
    context: 'Moving to a major metropolis offers networking and big-city excitement, but higher rent and distance from family. Staying home keeps expenses low and close relationships intact.',
    options: ['Move to Major Tech Hub', 'Stay in Hometown & Work Remotely'],
    category: 'Lifestyle',
    icon: 'Compass',
  },
  {
    id: 'car-ev-hybrid',
    title: 'Electric Vehicle (EV) vs Hybrid vs Gas SUV',
    context: 'Driving ~12,000 miles/year. Have garage for home charging. Looking for reliability, total cost of ownership, and resale value over 5 years.',
    options: ['Full Electric Vehicle (EV)', 'Plug-In Hybrid (PHEV)', 'Gasoline SUV'],
    category: 'Purchases',
    icon: 'Car',
  },
  {
    id: 'business-saas-custom',
    title: 'Buy Off-the-Shelf SaaS vs Build Custom In-House Tool',
    context: 'Off-the-shelf software costs $500/month with 80% feature fit. Building custom tool takes 3 months engineering effort but gives 100% control.',
    options: ['Buy Off-the-Shelf SaaS', 'Build Custom Tool In-House'],
    category: 'Business',
    icon: 'Code2',
  },
  {
    id: 'education-grad-school',
    title: 'Pursue Master’s / MBA Degree vs Gain 2 Years Experience',
    context: 'Grad school costs $60k in tuition and 2 years lost salary, but opens executive leadership paths. Remaining in workforce gains practical industry tenure.',
    options: ['Enroll in Full-time Graduate Program', 'Stay in Workforce & Pursue Certifications'],
    category: 'Education',
    icon: 'GraduationCap',
  }
];
