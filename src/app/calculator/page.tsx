import { supabase } from '@/lib/supabase';
import CalculatorClient from './CalculatorClient';

export const dynamic = 'force-dynamic';

export default async function CalculatorPage() {
  const [
    { data: states },
    { data: chargerTypes },
    { data: subsidies },
    { data: costComponents },
  ] = await Promise.all([
    supabase.from('states').select('*').order('name'),
    supabase.from('charger_types').select('*').order('power_kw'),
    supabase.from('subsidies').select('*'),
    supabase.from('cost_components').select('*'),
  ]);

  return (
    <CalculatorClient
      states={states ?? []}
      chargerTypes={chargerTypes ?? []}
      subsidies={subsidies ?? []}
      costComponents={costComponents ?? []}
    />
  );
}
