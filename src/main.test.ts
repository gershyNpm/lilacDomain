import { Soil, type Context, type PetalTerraform } from '@gershy/lilac';
import { assertEqual, testRunner } from '../build/utils.test.ts';
import { Domain } from './main.ts';

// Type testing
(async () => {
  
  type Enforce<Provided, Expected extends Provided> = { provided: Provided, expected: Expected };
  
  type Tests = {
    1: Enforce<{ x: 'y' }, { x: 'y' }>,
  };
  if (0) ((v?: Tests) => void 0)();
  
})();

testRunner([
  
  { name: 'basic', fn: async () => {
    
    const domain = new Domain('my-cool-site.com', 443);
    
    const ctx: Context = {
      pfx: 'aaa',
      maturity: 'm0',
      debug: true
    } as any;
    const soil: Soil.Base = null as any;
    
    const petals: PetalTerraform.Base[] = [];
    for await (const petal of await domain.getPetals({ ...ctx, soil }))
      petals.push(petal);
    
    const tf = (await Promise.all(petals.map(p => p.getResult()))).join('\n');
    
    // TODO: Implement!
    assertEqual(
      tf,
      String[cl.baseline](`
        | data "aws_route53_zone" "domain_mycoolsite_com" { name = "my-cool-site.com" }
      `)
    );
    
  }}
  
]);