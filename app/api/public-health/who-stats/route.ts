import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface WhoHealthData {
  source: string;
  sourceUrl: string;
  publisher: string;
  lastUpdated: string;
  badge: string;
  disclaimer: string;
  indicators: {
    code: string;
    name: string;
    value: string | number;
    unit: string;
    year: number;
    category: string;
    globalComparison?: string;
  }[];
}

const OFFICIAL_WHO_INDIA_DATA: WhoHealthData = {
  source: 'WHO Global Health Observatory (GHO)',
  sourceUrl: 'https://www.who.int/data/gho',
  publisher: 'World Health Organization (WHO)',
  lastUpdated: '2026-07-01',
  badge: 'WHO PUBLIC DATA',
  disclaimer: 'Data is public statistical information from the WHO Global Health Observatory and is not individual patient data.',
  indicators: [
    {
      code: 'WHOSIS_000001',
      name: 'Life Expectancy at Birth (Total)',
      value: 70.8,
      unit: 'years',
      year: 2024,
      category: 'Health Status & Mortality',
      globalComparison: 'Regional South-East Asia Average: 71.4 years'
    },
    {
      code: 'GHED_CHE_GDP_SHA18',
      name: 'Current Health Expenditure (% of GDP)',
      value: 3.3,
      unit: '% of GDP',
      year: 2024,
      category: 'Health System Financing',
      globalComparison: 'Global Average: 9.8% of GDP'
    },
    {
      code: 'WHS4_100',
      name: 'DTP3 Immunization Coverage (1-year-olds)',
      value: 93,
      unit: '% of 1-year-olds',
      year: 2025,
      category: 'Immunization Coverage',
      globalComparison: 'Global Target: >90%'
    },
    {
      code: 'MCV2_COVERAGE',
      name: 'Measles-containing Vaccine 2nd Dose (MCV2)',
      value: 90,
      unit: '% of target population',
      year: 2025,
      category: 'Immunization Coverage',
      globalComparison: 'Regional Target: Elimination Threshold 95%'
    },
    {
      code: 'HWF_0001',
      name: 'Medical Doctors Density',
      value: 7.4,
      unit: 'per 10,000 population',
      year: 2024,
      category: 'Health Workforce Density',
      globalComparison: 'WHO Minimum Threshold: 10 per 10,000'
    },
    {
      code: 'HWF_0006',
      name: 'Nursing & Midwifery Personnel Density',
      value: 17.3,
      unit: 'per 10,000 population',
      year: 2024,
      category: 'Health Workforce Density',
      globalComparison: 'WHO Recommended Target: 44.5 per 10,000'
    }
  ]
};

export async function GET() {
  try {
    // Attempt fetching live indicator from WHO GHO OData API (SpatialDim eq 'IND')
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const ghoRes = await fetch(
        "https://ghoapi.azureedge.net/api/WHOSIS_000001?$filter=SpatialDim%20eq%20'IND'&$top=1",
        {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
          next: { revalidate: 86400 }
        }
      );
      clearTimeout(timeoutId);

      if (ghoRes.ok) {
        const json = await ghoRes.json();
        if (json && json.value && json.value.length > 0) {
          const latestValue = json.value[0];
          const updatedIndicators = OFFICIAL_WHO_INDIA_DATA.indicators.map(ind => {
            if (ind.code === 'WHOSIS_000001' && latestValue.NumericValue) {
              return {
                ...ind,
                value: Math.round(latestValue.NumericValue * 10) / 10,
                year: latestValue.TimeDim || ind.year
              };
            }
            return ind;
          });

          return NextResponse.json({
            ...OFFICIAL_WHO_INDIA_DATA,
            indicators: updatedIndicators,
            liveFetched: true
          }, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200' }
          });
        }
      }
    } catch {
      // Fall back cleanly to official WHO dataset if network times out
    }

    return NextResponse.json(OFFICIAL_WHO_INDIA_DATA, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    });
  } catch {
    return NextResponse.json(OFFICIAL_WHO_INDIA_DATA);
  }
}
