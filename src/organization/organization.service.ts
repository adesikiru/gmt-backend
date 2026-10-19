import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  // ---- STATES ----
  async getStates() {
    return this.prisma.state.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async getState(id: string) {
    const state = await this.prisma.state.findUnique({ where: { id }, include: { lgas: { where: { isActive: true } } } });
    if (!state) throw new NotFoundException('State not found');
    return state;
  }

  async createState(data: { name: string; code: string }) {
    return this.prisma.state.create({ data });
  }

  // ---- LGAs ----
  async getLGAs(stateId?: string) {
    return this.prisma.lGA.findMany({
      where: { isActive: true, ...(stateId ? { stateId } : {}) },
      include: { state: true },
      orderBy: { name: 'asc' },
    });
  }

  async getLGA(id: string) {
    const lga = await this.prisma.lGA.findUnique({ where: { id }, include: { state: true, wards: { where: { isActive: true } } } });
    if (!lga) throw new NotFoundException('LGA not found');
    return lga;
  }

  async createLGA(data: { name: string; stateId: string }) {
    return this.prisma.lGA.create({ data });
  }

  // ---- WARDS ----
  async getWards(lgaId?: string) {
    return this.prisma.ward.findMany({
      where: { isActive: true, ...(lgaId ? { lgaId } : {}) },
      include: { lga: { include: { state: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getWard(id: string) {
    const ward = await this.prisma.ward.findUnique({ where: { id }, include: { lga: { include: { state: true } }, pollingUnits: true } });
    if (!ward) throw new NotFoundException('Ward not found');
    return ward;
  }

  async createWard(data: { name: string; lgaId: string }) {
    return this.prisma.ward.create({ data });
  }

  // ---- POLLING UNITS ----
  async getPollingUnits(wardId?: string) {
    return this.prisma.pollingUnit.findMany({
      where: { isActive: true, ...(wardId ? { wardId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async createPollingUnit(data: { name: string; code?: string; wardId: string }) {
    return this.prisma.pollingUnit.create({ data });
  }

  // ---- INEC PUBLIC API PROXY WITH CACHE ----
  private inecCache = new Map<string, { data: unknown[]; timestamp: number }>();
  private CACHE_TTL = 1000 * 60 * 60 * 12; // 12 hours

  private inecStates = [
    { id: '28', name: 'Ogun', fullName: '27 - OGUN', code: 'OG' },
    { id: '1', name: 'Abia', fullName: '01 - ABIA', code: 'AB' },
    { id: '2', name: 'Adamawa', fullName: '02 - ADAMAWA', code: 'AD' },
    { id: '3', name: 'Akwa Ibom', fullName: '03 - AKWA IBOM', code: 'AK' },
    { id: '4', name: 'Anambra', fullName: '04 - ANAMBRA', code: 'AN' },
    { id: '5', name: 'Bauchi', fullName: '05 - BAUCHI', code: 'BA' },
    { id: '6', name: 'Bayelsa', fullName: '06 - BAYELSA', code: 'BY' },
    { id: '7', name: 'Benue', fullName: '07 - BENUE', code: 'BN' },
    { id: '8', name: 'Borno', fullName: '08 - BORNO', code: 'BO' },
    { id: '9', name: 'Cross River', fullName: '09 - CROSS RIVER', code: 'CR' },
    { id: '10', name: 'Delta', fullName: '10 - DELTA', code: 'DE' },
    { id: '11', name: 'Ebonyi', fullName: '11 - EBONYI', code: 'EB' },
    { id: '12', name: 'Edo', fullName: '12 - EDO', code: 'ED' },
    { id: '13', name: 'Ekiti', fullName: '13 - EKITI', code: 'EK' },
    { id: '14', name: 'Enugu', fullName: '14 - ENUGU', code: 'EN' },
    { id: '15', name: 'FCT (Abuja)', fullName: '37 - FCT', code: 'FC' },
    { id: '16', name: 'Gombe', fullName: '15 - GOMBE', code: 'GO' },
    { id: '17', name: 'Imo', fullName: '16 - IMO', code: 'IM' },
    { id: '18', name: 'Jigawa', fullName: '17 - JIGAWA', code: 'JI' },
    { id: '19', name: 'Kaduna', fullName: '18 - KADUNA', code: 'KD' },
    { id: '20', name: 'Kano', fullName: '19 - KANO', code: 'KN' },
    { id: '21', name: 'Katsina', fullName: '20 - KATSINA', code: 'KT' },
    { id: '22', name: 'Kebbi', fullName: '21 - KEBBI', code: 'KB' },
    { id: '23', name: 'Kogi', fullName: '22 - KOGI', code: 'KG' },
    { id: '24', name: 'Kwara', fullName: '23 - KWARA', code: 'KW' },
    { id: '25', name: 'Lagos', fullName: '24 - LAGOS', code: 'LA' },
    { id: '26', name: 'Nasarawa', fullName: '25 - NASARAWA', code: 'NA' },
    { id: '27', name: 'Niger', fullName: '26 - NIGER', code: 'NI' },
    { id: '29', name: 'Ondo', fullName: '28 - ONDO', code: 'ON' },
    { id: '30', name: 'Osun', fullName: '29 - OSUN', code: 'OS' },
    { id: '31', name: 'Oyo', fullName: '30 - OYO', code: 'OY' },
    { id: '32', name: 'Plateau', fullName: '31 - PLATEAU', code: 'PL' },
    { id: '33', name: 'Rivers', fullName: '32 - RIVERS', code: 'RI' },
    { id: '34', name: 'Sokoto', fullName: '33 - SOKOTO', code: 'SO' },
    { id: '35', name: 'Taraba', fullName: '34 - TARABA', code: 'TA' },
    { id: '36', name: 'Yobe', fullName: '35 - YOBE', code: 'YO' },
    { id: '37', name: 'Zamfara', fullName: '36 - ZAMFARA', code: 'ZA' },
  ];

  async getInecStates() {
    return this.inecStates;
  }

  private parseInecResponse(rawJson: unknown) {
    if (!Array.isArray(rawJson) || rawJson.length === 0) return [];
    const mapObj = rawJson[0] as Record<string, string>;
    const items: Array<{ id: string; name: string; code?: string; rawName?: string }> = [];

    for (const [key, value] of Object.entries(mapObj)) {
      if (key === '0' || key === 'selected' || !value || value.startsWith('--')) {
        continue;
      }
      const raw = String(value).trim();
      const match = raw.match(/^(\d{1,4})\s*-\s*(.+)$/);
      const code = match ? match[1] : undefined;
      const cleanName = match ? match[2].trim() : raw;

      items.push({ id: key, name: cleanName, code, rawName: raw });
    }

    return items.sort((a, b) => {
      if (a.code && b.code) {
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      }
      return a.name.localeCompare(b.name);
    });
  }

  private async fetchInec(url: string) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://cvr.inecnigeria.org/pu',
      },
    });
    if (!res.ok) throw new Error(`INEC API returned HTTP ${res.status}`);
    return res.json();
  }

  async getInecLGAs(stateId: string) {
    const cacheKey = `lgas_${stateId}`;
    const cached = this.inecCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    const url = `https://cvr.inecnigeria.org/PublicApi/lgas/1/Search?data%5BSearch%5D%5Bstate_id%5D=${encodeURIComponent(
      stateId,
    )}`;
    const json = await this.fetchInec(url);
    const items = this.parseInecResponse(json);
    if (items.length > 0) this.inecCache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  }

  async getInecWards(lgaId: string) {
    const cacheKey = `wards_${lgaId}`;
    const cached = this.inecCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    const url = `https://cvr.inecnigeria.org/PublicApi/wards/1/Search?data%5BSearch%5D%5Blocal_government_id%5D=${encodeURIComponent(
      lgaId,
    )}`;
    const json = await this.fetchInec(url);
    const items = this.parseInecResponse(json);
    if (items.length > 0) this.inecCache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  }

  async getInecPollingUnits(wardId: string) {
    const cacheKey = `pus_${wardId}`;
    const cached = this.inecCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    const url = `https://cvr.inecnigeria.org/PublicApi/pus/1/Search?data%5BSearch%5D%5Bregistration_area_id%5D=${encodeURIComponent(
      wardId,
    )}`;
    const json = await this.fetchInec(url);
    const items = this.parseInecResponse(json);
    if (items.length > 0) this.inecCache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  }
}
