import '@gershy/clearing';
import { Flower, PetalTerraform, Soil, type Context } from '@gershy/lilac';
import phrasing from '@gershy/util-phrasing';

export class Domain extends Flower {
  
  protected addr: string;
  protected port: number;
  constructor(addr: string, port: number) {
    
    super();
    this.addr = addr;
    this.port = port;
    
  }
  
  public getPort      () { return this.port; }
  public getNameFull  () { return this.addr; }
  public getNamePcs   () { return this.addr.split('.'); }
  public hasSubdomain () { return this.addr.split('.').length > 2; }
  public getNameBase  () { return this.addr.split('.').slice(-2).join('.'); }
  public getHostedZone() {
    const baseDomain = this.getNameBase();
    const baseDomainHandle = phrasing('parts->camel', [
      'domain',
      ...baseDomain.replace(/[^a-zA-Z0-9.]/g, '').split('.'),
    ]);
    return new PetalTerraform.Data('awsRoute53Zone', baseDomainHandle, {
      name: baseDomain // Manually-created hosted zone ought to be for the base domain!!
    });
  }
  
  public async computePetals(ctx: Context & { soil: Soil.Base }) {
    const domain = this;
    return (async function*() {
      yield domain.getHostedZone();
    })();
  }
  
};