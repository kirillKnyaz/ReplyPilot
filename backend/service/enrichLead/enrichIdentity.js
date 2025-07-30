const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { customSearchRequest } = require('../customSearch.js');

const enrichIdentity = async ({
  userId,
  currentStep,
  leadId,
  existingData = {},  
}) => {
  // load lead
  const lead = await prisma.lead.findUnique({
    where: { id: leadId, userId: userId },
  })
}

const getNextSource = async (leadId, existingData) => {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      sources: {
        where: { goal: 'IDENTITY' },
        select: { url: true } // Include only the URL field
      }
    }
  });

  const urls = new Set(lead.sources.map(source => source.url));

  // check if there is a website available and hasnt been used first
  if (lead.website && !urls.has(lead.website)) {
    // store so doesn't get used again
    try {
      const createdSource = await prisma.leadSource.create({
        data: {
          leadId: lead.id,
          url: lead.website,
          goal: 'IDENTITY',
          type: 'WEBSITE',
        },
        select: { url: true }
      });

      return createdSource.url;
    } catch (error) {
      throw new Error(`Error creating source for lead ${leadId}: ${error.message}`);
    }
  }
  
  // if no website has been provided, and hasnt't been used, look for a website on the web
  if (!lead.website || !urls.has(lead.website)) {
    const webSearch = await customSearchRequest({
      query: `${lead.name} ${lead.company || ''} website`,
      page: 1,
    });

    
  }

  return null;
}