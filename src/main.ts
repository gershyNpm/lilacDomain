import '@gershy/clearing';
import { Flower, PetalTerraform } from '@gershy/lilac';
import phrasing from '@gershy/util-phrasing';
import type { NetProc } from '@gershy/util-http';

export class Domain extends Flower {
  
  static getAwsServices() { return [ 'route53' ] as const; }
  
  protected addr: string;
  protected port: number;
  protected proto: 'http' | 'https';
  constructor(args: { proto?: 'http' | 'https', addr: string, port: number }) {
    
    super();
    this.proto = args.proto ?? 'https';
    this.addr = args.addr;
    this.port = args.port;
    
  }
  
  public getNetProc(): NetProc { return { proto: this.proto, addr: this.addr, port: this.port }; }
  
  public getAddr      () { return this.addr; }
  public getAddrBase  () { return this.addr.split('.').slice(-2).join('.'); }
  public getAddrPcs   () { return this.addr.split('.'); }
  public hasSubdomain () { return this.addr.split('.').length > 2; }
  
  public async * computePetals() {
    
    const baseDomain = this.getAddrBase();
    const baseDomainHandle = phrasing('parts->camel', [
      'domain',
      ...baseDomain.replace(/[^a-zA-Z0-9.]/g, '').split('.'),
    ]);
    
    const zone = new PetalTerraform.Resource('awsRoute53Zone', baseDomainHandle, {
      name: baseDomain
    });
    yield zone;
    
    yield new PetalTerraform.Output(`${baseDomainHandle}Output`, zone.ref('nameServers'), async nameservers => {
      
      if (!cl.isCls(nameservers, Array)) nameservers = [ nameservers ];
      
      return { [`domain/${this.getAddrBase()}`]: { manualRequirements: [
        [
          `To link your domain "${this.addr}" you must:`,
          `1. navigate to your provider for that domain,`,
          `2. enable custom nameservers,`,
          `3. remove any preexisting nameservers, and`,
          `4. add the following nameservers: ${nameservers.join(' and ')}`
        ].join(' ')
      ]}};
      
    });
    
  }
  
};