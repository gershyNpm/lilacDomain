import '@gershy/clearing';
import { Flower, Garden, PetalTerraform } from '@gershy/lilac';
import phrasing from '@gershy/util-phrasing';
import type { NetProc } from '@gershy/util-http';

export class Domain extends Flower {
  
  static getAwsServices() { return [ 'route53' ] as const; }
  
  protected addr: string;
  protected port: number;
  protected proto: 'http' | 'https';
  constructor(args: { garden?: Garden<any, any>, proto?: Domain['proto'], addr: string, port?: number }) {
    
    super(args);
    this.proto = args.proto ?? 'https';
    this.addr = args.addr;
    this.port = args.port ?? ({ http: 80, https: 443 } satisfies { [K in Domain['proto']]: number })[this.proto];
    
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
    
  }
  
};