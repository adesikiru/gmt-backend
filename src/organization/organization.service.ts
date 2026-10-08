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
}
