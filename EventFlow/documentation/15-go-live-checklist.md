# Go-Live Checklist

## Configuration
- [ ] Production Firebase project/web app configured
- [ ] Google Authentication enabled
- [ ] Authorized domains configured
- [ ] Firestore configured
- [ ] Production environment variables configured
- [ ] Cloud Functions deployed
- [ ] Calendar API configured
- [ ] School Calendar ID configured securely
- [ ] Email delivery configured

## Security
- [ ] Firestore Security Rules reviewed
- [ ] Staff cannot perform admin-only mutations
- [ ] Inactive users cannot access protected features
- [ ] No secrets in frontend source
- [ ] No real student data in GitHub
- [ ] Portfolio screenshots use fictional/anonymized data

## Master Data
- [ ] Approved users loaded
- [ ] Active staff loaded
- [ ] Driver eligibility reviewed
- [ ] Active students loaded
- [ ] Grades validated
- [ ] Dietary data reviewed
- [ ] Active vehicles loaded
- [ ] Initial activities loaded
- [ ] Initial event types loaded
- [ ] Test data removed/marked

## Testing
- [ ] Production build passes
- [ ] UAT complete
- [ ] Authentication and permissions tested
- [ ] Event CRUD/statuses tested
- [ ] Student/staff participant flows tested
- [ ] Multiple drivers tested
- [ ] Vehicles tested
- [ ] Search/filtering tested
- [ ] Dashboard tested
- [ ] Calendar create/update/delete/failure tested
- [ ] Confirmation email tested
- [ ] Mobile layout tested on real phone

## User Acceptance
- [ ] Athletic Director tested representative events
- [ ] At least one additional staff user tested creation
- [ ] Teacher-facing participant info reviewed
- [ ] Kitchen-facing meal/dietary info reviewed
- [ ] Driver-facing info reviewed

## Training
- [ ] Staff quick guide prepared
- [ ] Admin master-data guide prepared
- [ ] Pilot users identified
- [ ] Defect-reporting path communicated
- [ ] Users understand EventFlow/Firestore is source of truth

## Rollback and Support
- [ ] Last known-good release tagged
- [ ] Rollback procedure documented
- [ ] Manual fallback available during pilot
- [ ] Support owner identified
- [ ] Feedback channel identified

## Pilot and Production
- [ ] Pilot start date selected
- [ ] Pilot users notified
- [ ] Feedback review scheduled
- [ ] Pilot issues resolved/accepted
- [ ] Go-live approved
- [ ] Production deployed
- [ ] Post-go-live verification complete
