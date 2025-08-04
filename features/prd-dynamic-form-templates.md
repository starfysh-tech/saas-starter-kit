# PRD: Dynamic Form Templates for Patient Data Collection

## Introduction/Overview

Current patient data collection uses a hardcoded form with basic fields (firstName, lastName, mobile, gender). Clinical teams need flexible, disease-specific forms with complex field types like cascading selections, severity scales, and conditional fields. This feature replaces the hardcoded patient form with a dynamic template system that supports complex clinical workflows while maintaining the existing multi-tenant architecture.

**Goal:** Enable clinical teams to collect comprehensive, disease-specific patient data through customizable form templates managed by the mQOL team.

## Goals

1. **Replace hardcoded forms** - Convert existing patient form to use dynamic JSON templates
2. **Support complex field types** - Enable cascading fields, severity scales, and conditional field display
3. **Enable team customization** - Allow different teams to use different patient intake forms based on their clinical needs
4. **Reduce data collection time** - Streamline clinical workflows with disease-specific forms
5. **Maintain data quality** - Ensure robust validation and required field enforcement through template configuration

## User Stories

1. **As a mQOL team member**, I want to create JSON form templates so that clinical teams can collect disease-specific patient data without code changes.

2. **As a mQOL team member**, I want to assign form template versions to teams so that each team gets the appropriate intake form for their patient population.

3. **As a clinical staff member**, I want to fill out patient forms with fields relevant to my disease area so that I can efficiently collect comprehensive patient data.

4. **As a clinical staff member**, I want forms with cascading fields and severity scales so that I can capture complex clinical relationships (like treatment status → current status, or symptoms with severity ratings).

5. **As a team admin**, I want to see which form template my team is using so that I understand what data is being collected from our patients.

## Functional Requirements

1. **The system must render patient forms dynamically** based on JSON template configurations stored in the database.

2. **The system must support complex field types** including:
   - Cascading select fields (two-step dependent dropdowns)
   - Checkbox groups with severity rating scales
   - Date pickers with custom validation and display formats
   - Phone number inputs with automatic formatting
   - Email inputs with validation
   - Radio button groups
   - Multi-select checkbox groups
   - Text/textarea inputs with validation rules

3. **The system must support conditional field display** where fields can show/hide based on values in other fields.

4. **The system must validate form data** according to validation rules defined in the template configuration.

5. **mQOL team members must be able to create form templates** through JSON configuration files and database insertion.

6. **mQOL team members must be able to assign template versions to teams** through the FormAssignment system.

7. **The system must maintain backward compatibility** with existing patient records and API endpoints.

8. **The system must enforce team-scoped access** to form templates and patient data per existing permission system.

9. **The system must support template versioning** so that teams receive stable form versions while allowing template updates.

10. **The system must store form submission data** in a structured format that supports the existing patient model and clinical workflows.

## Implementation Approach

**Simplest Technical Approach:**

1. **Database Extension** - Add minimal tables (FormTemplate, FormAssignment) and extend existing Patient table with form_template_id reference
2. **JSON Template Configuration** - Define form structure, validation, and field relationships in JSON format
3. **Dynamic Form Component** - Build generic React component that renders forms from template configuration
4. **Manual Template Management** - mQOL team manages templates via JSON files + SQL scripts (no form builder UI)
5. **Gradual Migration** - Create default template matching current patient form, then migrate teams to custom templates

**Complexity Justification:**
Complex field types (cascading, severity scales) are essential for clinical workflows and cannot be simplified without losing core functionality. However, we avoid form builder UI complexity by using manual JSON management.

**Simpler Alternatives Considered:**
- Static form variations: Too rigid for diverse clinical needs
- Simple field types only: Insufficient for clinical data relationships
- Separate data tables per form: Overly complex for v1 scope

## Non-Goals (Out of Scope)

1. **Visual form builder interface** - Templates managed manually through JSON configuration
2. **Baseline and PRO data collection** - Focus on Patient forms only for v1
3. **Advanced form analytics** - Basic usage tracking only
4. **Patient self-service forms** - Clinical staff entry only
5. **Form template sharing between organizations** - Internal mQOL management only
6. **Real-time collaboration on forms** - Single-user form completion
7. **Form template marketplace** - Custom templates only

## Design Considerations

- **Reuse existing components** - Leverage current Modal, InputWithLabel, and form styling patterns
- **Consistent UI/UX** - Dynamic forms should match current patient form appearance and behavior
- **Mobile responsiveness** - Ensure complex field types work on tablets/mobile devices used in clinical settings
- **Accessibility** - Maintain WCAG compliance for form controls and field relationships

## Technical Considerations

- **Integration with existing Auth** - Use current NextAuth.js and permission system
- **Database compatibility** - Extend Prisma schema with new tables
- **API consistency** - Maintain existing `/api/teams/[slug]/patients` endpoint structure
- **Audit logging** - Ensure form submissions integrate with existing Retraced audit system
- **Validation consistency** - Generate Zod schemas dynamically from template configuration
- **HIPAA compliance** - Maintain existing soft-delete and retention policies for dynamic form data

## Success Metrics

1. **Reduced data collection time** - Measure time to complete patient intake forms (target: 20% reduction)
2. **Improved clinical data quality** - Track form completion rates and required field compliance (target: >95% completion)
3. **Reduced support requests** - Monitor requests for form changes and customizations (target: 50% reduction)
4. **Team adoption rate** - Track number of teams using custom form templates (target: 80% of active teams within 6 months)

## Open Questions

1. **Data migration strategy** - How should existing patient records transition to template-based system?
2. **Template validation** - What safeguards prevent invalid JSON templates from breaking forms?
3. **Performance impact** - How will dynamic form rendering affect page load times?
4. **Template backup/recovery** - How should template configurations be backed up and versioned?

## Implementation Risks

1. **Breaking changes** - Dynamic form system could disrupt existing patient workflows if not properly tested
2. **Data integrity** - JSON-based field definitions may introduce validation gaps compared to typed database fields
3. **Performance degradation** - Complex field rendering and validation could slow form interactions
4. **Template complexity** - Manual JSON management may become unwieldy as templates grow in complexity
5. **Migration complexity** - Converting existing hardcoded forms to template-based system requires careful data migration planning