import { defineField, defineType } from 'sanity'

export const leadType = defineType({
  name: 'lead',
  title: 'Leads',
  type: 'document',
  fields: [
    defineField({
      name: 'formType',
      title: 'Form type',
      type: 'string',
      options: { list: ['contact', 'coa'] },
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'company', title: 'Company', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: (Rule) => Rule.required().email() }),
    defineField({ name: 'phone', title: 'Phone / WhatsApp', type: 'string' }),
    defineField({ name: 'interest', title: 'Interest', type: 'string' }),
    defineField({ name: 'message', title: 'Message', type: 'text', rows: 6 }),
    defineField({ name: 'industry', title: 'Industry', type: 'string' }),
    defineField({ name: 'productName', title: 'Product', type: 'string' }),
    defineField({ name: 'quantity', title: 'Quantity', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ name: 'demand', title: 'Annual demand', type: 'string' }),
    defineField({ name: 'application', title: 'Application', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'coaUrl', title: 'COA URL', type: 'url' }),
    defineField({ name: 'sourcePage', title: 'Source page', type: 'url' }),
    defineField({ name: 'sourceCountry', title: 'Visitor country', type: 'string', readOnly: true }),
    defineField({ name: 'sourceRegion', title: 'Visitor region', type: 'string', readOnly: true }),
    defineField({ name: 'sourceCity', title: 'Visitor city', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Submitted at', type: 'datetime', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'status',
      title: 'Lead status',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Contacted', value: 'contacted' },
          { title: 'Qualified', value: 'qualified' },
          { title: 'Closed won', value: 'closed_won' },
          { title: 'Closed lost', value: 'closed_lost' },
          { title: 'Spam', value: 'spam' },
          { title: 'Legacy: email delivery failed', value: 'email_failed' },
        ],
        layout: 'radio',
      },
      initialValue: 'new',
    }),
    defineField({ name: 'leadOwner', title: 'Lead owner', type: 'string' }),
    defineField({ name: 'followUpAt', title: 'Follow-up date', type: 'date' }),
    defineField({ name: 'salesNotes', title: 'Sales notes', type: 'text', rows: 6 }),
    defineField({ name: 'teamEmailStatus', title: 'Team email delivery', type: 'string', options: { list: ['pending', 'sent', 'failed'] }, readOnly: true }),
    defineField({ name: 'autoReplyStatus', title: 'Auto-reply delivery', type: 'string', options: { list: ['pending', 'sent', 'failed'] }, readOnly: true }),
    defineField({ name: 'submissionId', title: 'Submission ID', type: 'string', readOnly: true }),
  ],
  preview: {
    select: { title: 'name', company: 'company', email: 'email', status: 'status' },
    prepare({ title, company, email, status }) {
      return {
        title: company ? `${title} — ${company}` : title,
        subtitle: `${status || 'new'} · ${email}`,
      }
    },
  },
})
