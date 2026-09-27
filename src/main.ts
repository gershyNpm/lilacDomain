import '@gershy/clearing';
import { Flower, Garden, PetalTerraform } from '@gershy/lilac';
import phrasing from '@gershy/util-phrasing';
import type { NetProc } from '@gershy/util-http';

export class Domain extends Flower {
  
  // TODO: Multiple gardens using the same name will conflict (or is this a good thing?) - can
  // only have one aws_route53_zone per unique domain name. Consider how to handle two gardens
  // on different subdomains of the same base domain. Pretty safe: `terraform apply` will fail in
  // its attempt to duplicate the zone
  
  static getAwsServices() { return [ 'route53' ] as const; }
  
  protected addr: `${string}.${string}`;
  protected port: number;
  protected proto: 'http' | 'https';
  protected manualConfirmations: {
    nameServersConnected: boolean
  };
  constructor(inp: {
    garden?: Garden<any, any>,
    proto?: Domain['proto'],
    addr: `${string}.${string}`,
    port?: number,
    manualConfirmations?: {
      nameServersConnected?: boolean
    }
  }) {
    
    super(inp);
    
    // Tlds can contain digits, but must also contain at least one character in `[a-z]`
    // Note subdomains are *not allowed* here - a `Domain` represents domain+tld and nothing else!
    // TODO: How does aws handle internationalized/punycode domains? And the regex here can be
    // tightened, e.g. tlds must have at least one character in `[a-z]`
    Error[cl.assert](inp, inp => /^[a-z0-9-]+[.][a-z0-9-]+$/.test(inp.addr));
    
    this.proto = inp.proto ?? 'https';
    this.addr = inp.addr;
    this.port = inp.port ?? ({ http: 80, https: 443 } satisfies { [K in Domain['proto']]: number })[this.proto];
    this.manualConfirmations = {
      nameServersConnected: false,
      ...(inp.manualConfirmations ?? {})
    };
    
  }
  
  public getFlowerId ()          { return null; }
  public getNetProc  (): NetProc { return { proto: this.proto, addr: this.addr, port: this.port }; }
  public getAddr     ()          { return this.addr; }
  public getAddrBase ()          { return this.addr.split('.').slice(-2).join('.') as `${string}.${string}`; }
  public getAddrPcs  ()          { return this.addr.split('.'); }
  public hasSubdomain()          { return this.addr.split('.').length > 2; }
  public nameServersConnected  ()          { return this.manualConfirmations.nameServersConnected; } // TODO: "servable" -> "integrated" - as in, "integrated into lilac/garden"??
  
  public computePetals() {
    
    const petals = new Set<PetalTerraform.Base>();
    const addPetal = <P extends PetalTerraform.Base>(p: P): P => (petals.add(p), p);
    
    const baseDomain = this.getAddrBase();
    const baseDomainHandle = phrasing('parts->camel', [
      'domain',
      ...baseDomain.replace(/[^a-zA-Z0-9.]/g, '').split('.'),
    ]);
    
    // Subdomains should possibly be a fully separate resource from `Domain`??
    const hostedZone = addPetal(new PetalTerraform.Resource('awsRoute53Zone', baseDomainHandle, {
      name: baseDomain,
      forceDestroy: true
    }));
    
    const domainHandle = phrasing('parts->camel', [
      'domain',
      ...this.getAddrPcs().map(pc => pc.replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean)
    ]);
    
    // Enforce manual name server setup
    if (!this.manualConfirmations.nameServersConnected) addPetal(new PetalTerraform.Output(domainHandle, hostedZone.ref('nameServers'), async (ns: string[]) => {
      
      // Consider setting a raw `nameServers` property to make this more machine-readable
      return { manualRequirements: {
        [`domain/${this.getAddrBase()}`]: String[cl.baseline](`
          | The domain "${this.getAddr()}" has been declared but it is not yet servable. To make this domain servable:
          | (1) navigate to your provider for "${this.getAddr()}" (e.g. namecheap, godaddy, etc.),
          | (2) enable custom name servers for "${this.getAddr()}",
          | (3) remove any preexisting name servers,
          | (4) add the following name servers: ${ns.join(' and ')},
          | (5) set \`manualConfirmations: { nameServersConnected: true }\` in the Domain constructor for "${this.getAddr()}", and
          | (6) regrow your garden.
          | 
          | The resulting garden deployment will be servable via "${this.getAddr()}"! Note it may take time for dns values to fully propagate.
        `)
      }};
      
    }));
    
    return petals;
    
  }
  
};