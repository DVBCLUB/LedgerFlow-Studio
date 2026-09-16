import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  harvestB2BLeads,
  listB2BLeads,
  renderPersonalizedOutreachEmail,
} from './glaciaB2BLeadHarvester.ts';

describe('Glacia B2B Lead Harvester & Cold Outreach Engine (Epoch 7)', () => {
  it('harvests targeted B2B leads by industry and city with valid tax IDs and emails', () => {
    const res = harvestB2BLeads({
      industry: 'construction',
      targetCity: 'Đà Nẵng',
      limit: 2,
    });

    assert.equal(res.newLeadsCount, 2);
    assert.equal(res.harvestedLeads.length, 2);
    assert.ok(res.harvestedLeads[0].taxId.startsWith('0'));
    assert.equal(res.harvestedLeads[0].city, 'Đà Nẵng');
  });

  it('lists existing persistent leads across multiple pipeline stages', () => {
    const list = listB2BLeads();
    assert.ok(list.length >= 3);
    assert.ok(list.some((l) => l.industry === 'construction'));
    assert.ok(list.some((l) => l.industry === 'services'));
  });

  it('renders hyper-personalized cold outreach emails replacing variables correctly', () => {
    const list = listB2BLeads();
    const lead = list[0];

    const email = renderPersonalizedOutreachEmail(lead.id, 1);
    assert.ok(email.subject.includes(lead.companyName) || email.subject.includes('kế toán'));
    assert.ok(email.body.includes(lead.representative));
    assert.equal(email.targetEmail, lead.email);
  });
});
