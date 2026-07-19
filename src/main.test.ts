import { assertEqual, testRunner } from '../build/utils.test.ts';
import { Domain } from './main.ts';
import type { PetalTerraform } from '@gershy/lilac';

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
    
    
    // const context: Context = {
    //   pfx: 'aaa',
    //   maturity: 'm0',
    //   debug: true
    // } as any;
    // const soil: Soil.Base = null as any;
    const domain = new Domain({
      addr: 'my-cool-site.com',
      port: 443
    });
    
    const petals: PetalTerraform.Base[] = [];
    for await (const petal of await domain.getPetals())
      petals.push(petal);
    
    const tf = (await Promise.all(petals.map(p => p.getResult()))).join('\n');
    
    assertEqual(tf, String[cl.baseline](`
      | resource "aws_route53_zone" "domain_mycoolsite_com" { name = "my-cool-site.com" }
      | output "domain_mycoolsite_com_output" {
      |   value = aws_route53_zone.domain_mycoolsite_com.name_servers
      |   description = "<no desc>"
      |   sensitive = false
      | }
    `));
    
  }}
  
]);