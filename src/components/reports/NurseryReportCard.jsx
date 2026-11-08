import { User } from 'lucide-react'
import AuthImage from '../AuthImage'

export default function NurseryReportCard({ data }) {
  if (!data) return null
  const school = data.school
  const student = data.student
  const clazz = data.class
  const subjects = data.subjects || []
  const legend = data.legend || []
  const termSummaries = data.termSummaries || []

  const grouped = []
  let current = null
  for (const s of subjects) {
    if (s.category === 'PRE-NUMBERS' || s.category === 'PRE-ENGLISH') {
      if (!current || current.name !== s.category) {
        current = { name: s.category, header: true }
        grouped.push(current)
      }
    }
    grouped.push(s)
  }

  return (
    <div className="print-area report-nursery">
      <div className="nursery-frame">
        {/* Header */}
        <header className="nursery-header">
          <div className="nursery-logo-wrap">
            <div className="nursery-logo">
              {school.logoPath ? (
                <AuthImage path={school.logoPath} alt="" />
              ) : (
                <span className="nursery-logo-fallback">{(school.name || 'SCHOOL').split(' ').slice(0, 2).map((w) => w[0]).join('')}</span>
              )}
            </div>
          </div>

          <div className="nursery-brand">
            <p className="nursery-gov">Republic of Rwanda · Ministry of Education</p>
            <h1 className="nursery-school-name">{school.name}</h1>
            <p className="nursery-school-place">{school.district || school.address || 'Kigali'}</p>
            <div className="nursery-brand-rule" />
            <p className="nursery-contact">
              {[school.phone && `Tel: ${school.phone}`, school.email].filter(Boolean).join('  ·  ')}
            </p>
            <p className="nursery-card-label">Nursery Progress Report Card</p>
          </div>

          <div className="nursery-photo-wrap">
            <div className="nursery-photo">
              {student.photoPath ? (
                <AuthImage path={student.photoPath} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="nursery-photo-placeholder" size={40} strokeWidth={1.25} />
              )}
            </div>
          </div>
        </header>

        {/* Student particulars */}
        <section className="nursery-meta" aria-label="Pupil particulars">
          <div className="nursery-meta-grid">
            <div className="nursery-meta-item nursery-meta-wide">
              <span className="nursery-meta-label">Pupil&apos;s name</span>
              <span className="nursery-meta-value">{student.fullName}</span>
            </div>
            <div className="nursery-meta-item">
              <span className="nursery-meta-label">Class</span>
              <span className="nursery-meta-value">{clazz.name}</span>
            </div>
            <div className="nursery-meta-item">
              <span className="nursery-meta-label">Age</span>
              <span className="nursery-meta-value">{data.age ?? '—'}</span>
            </div>
            <div className="nursery-meta-item">
              <span className="nursery-meta-label">Sex</span>
              <span className="nursery-meta-value">{student.sex}</span>
            </div>
            <div className="nursery-meta-item">
              <span className="nursery-meta-label">Academic year</span>
              <span className="nursery-meta-value">{data.year}</span>
            </div>
          </div>
        </section>

        {/* Marks + side panel */}
        <section className="nursery-body">
          <div className="nursery-marks-panel">
            <table className="nursery-marks">
              <thead>
                <tr>
                  <th className="nursery-col-subject">Subjects</th>
                  <th>1st Term</th>
                  <th>2nd Term</th>
                  <th>3rd Term</th>
                  <th>Annual</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((row, idx) => {
                  if (row.header) {
                    return (
                      <tr key={`h-${row.name}-${idx}`} className="nursery-cat-row">
                        <td colSpan={5}>{row.name}</td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={row.subjectId}>
                      <td className="nursery-col-subject">{row.name}</td>
                      {(row.terms || []).map((t, i) => (
                        <td
                          key={i}
                          className="print-grade-cell nursery-grade-cell"
                          style={{ backgroundColor: t.color || undefined }}
                        />
                      ))}
                      <td
                        className="print-grade-cell nursery-grade-cell"
                        style={{ backgroundColor: row.annual?.color || undefined }}
                      />
                    </tr>
                  )
                })}
                <tr className="nursery-total-row">
                  <td className="nursery-col-subject">Total grade</td>
                  {termSummaries.map((t, i) => (
                    <td
                      key={i}
                      className="print-grade-cell nursery-grade-cell"
                      style={{ backgroundColor: t.color || undefined }}
                    />
                  ))}
                  <td
                    className="print-grade-cell nursery-grade-cell"
                    style={{ backgroundColor: data.annualColor || undefined }}
                  />
                </tr>
                <tr className="nursery-sign-row">
                  <td className="nursery-col-subject">Teacher&apos;s signature</td>
                  <td colSpan={4} className="nursery-sign-cell">
                    {clazz.classTeacherSignature ? (
                      <AuthImage path={clazz.classTeacherSignature} alt="" className="nursery-sign-img" />
                    ) : (
                      <span className="nursery-sign-line" />
                    )}
                  </td>
                </tr>
                <tr className="nursery-sign-row">
                  <td className="nursery-col-subject">Parent&apos;s signature</td>
                  <td colSpan={4} className="nursery-sign-cell">
                    <span className="nursery-sign-line" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <aside className="nursery-side">
            <div className="nursery-side-block">
              <h2 className="nursery-side-title">Grade key</h2>
              <table className="nursery-legend">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Range</th>
                    <th>Colour</th>
                  </tr>
                </thead>
                <tbody>
                  {legend.map((l) => (
                    <tr key={l.label}>
                      <td>{l.label}</td>
                      <td>{l.range}</td>
                      <td
                        className="print-grade-cell nursery-grade-cell nursery-legend-swatch"
                        style={{ backgroundColor: l.color }}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="nursery-side-block nursery-comments">
              <h2 className="nursery-side-title">Comments</h2>
              <div className="nursery-comment-list">
                <p><span>1st Term</span>{termSummaries[0]?.comment || '—'}</p>
                <p><span>2nd Term</span>{termSummaries[1]?.comment || '—'}</p>
                <p><span>3rd Term</span>{termSummaries[2]?.comment || '—'}</p>
              </div>
            </div>

            <div className="nursery-side-block nursery-head">
              <h2 className="nursery-side-title">Head teacher</h2>
              <p className="nursery-head-name">{school.headTeacherName || '—'}</p>
              <div className="nursery-head-marks">
                {school.headSignaturePath && (
                  <AuthImage path={school.headSignaturePath} alt="" className="nursery-sign-img" />
                )}
                {school.stampPath && (
                  <AuthImage path={school.stampPath} alt="" className="nursery-stamp-img" />
                )}
              </div>
              <p className="nursery-head-note">Signature &amp; stamp</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
