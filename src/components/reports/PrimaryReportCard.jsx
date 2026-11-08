import { Fragment } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { User } from 'lucide-react'
import AuthImage from '../AuthImage'

export default function PrimaryReportCard({ data }) {
  if (!data) return null
  const school = data.school
  const student = data.student
  const clazz = data.class
  const subjects = data.subjects || []
  const summary = data.summaryTerms || []

  return (
    <div className="print-area report-primary mx-auto w-full max-w-[210mm] bg-white p-4 text-[10px] text-black shadow-lg" style={{ fontFamily: 'Times New Roman, serif' }}>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border-2 border-black p-2">
        <div>
          <p className="font-bold">REPUBLIC OF RWANDA</p>
          <p>MINISTRY OF EDUCATION</p>
          <p>District: {school.district}</p>
          <p className="font-bold">{school.name}</p>
          <p>School Code: {school.code}</p>
          <p>Email: {school.email}</p>
          <p>Phone: {school.phone}</p>
        </div>
        <div className="flex flex-col items-center justify-center border-2 border-black px-4 py-2 text-center">
          <p className="text-sm font-bold">STUDENT REPORT CARD: PRIMARY</p>
        </div>
        <div className="text-right">
          <p>Academic Year: <b>{data.year}</b></p>
          <p>Level: <b>PRIMARY</b></p>
          <p>Class: <b>{clazz.name}</b></p>
          <p>Combination: <b>{clazz.combination}</b></p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-2 border-black p-2">
        <div>
          <p>Student Names: <b>{student.fullName}</b></p>
          <p>Student Unique Identifier: <b>{student.uniqueId}</b></p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden border border-black bg-gray-50">
          {student.photoPath ? (
            <AuthImage path={student.photoPath} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="text-gray-400" size={28} />
          )}
        </div>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-200">
              <th rowSpan={2} className="border border-black px-1">Subjects</th>
              <th colSpan={3} className="border border-black">Maximum</th>
              {[1, 2, 3].map((t) => (
                <th key={t} colSpan={5} className="border border-black">Term {t}</th>
              ))}
              <th colSpan={4} className="border border-black">Annual</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-black">EU 50%</th>
              <th className="border border-black">ET 50%</th>
              <th className="border border-black">TOT 100%</th>
              {[1, 2, 3].map((t) => (
                <Fragment key={t}>
                  <th className="border border-black">EU</th>
                  <th className="border border-black">ET</th>
                  <th className="border border-black">TOT</th>
                  <th className="border border-black">%</th>
                  <th className="border border-black">GR</th>
                </Fragment>
              ))}
              <th className="border border-black">TOT</th>
              <th className="border border-black">MAX</th>
              <th className="border border-black">%</th>
              <th className="border border-black">GR</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, idx) => (
              <tr key={s.subjectId} className={idx % 2 ? 'bg-gray-50' : ''}>
                <td className="border border-black px-1 text-left font-semibold">{s.name}</td>
                <td className="border border-black text-center">{s.maxEu}</td>
                <td className="border border-black text-center">{s.maxEt}</td>
                <td className="border border-black text-center">{s.maxTotal}</td>
                {(s.terms || []).map((t, i) => (
                  <Fragment key={i}>
                    <td className="border border-black text-center">{fmt(t.eu)}</td>
                    <td className="border border-black text-center">{fmt(t.et)}</td>
                    <td className="border border-black text-center">{fmt(t.total)}</td>
                    <td className="border border-black text-center">{fmt(t.percent)}</td>
                    <td className="border border-black text-center font-bold">{t.grade}</td>
                  </Fragment>
                ))}
                <td className="border border-black text-center">{fmt(s.annualTotal)}</td>
                <td className="border border-black text-center">{fmt(s.annualMax)}</td>
                <td className="border border-black text-center">{fmt(s.annualPercent)}</td>
                <td className="border border-black text-center font-bold">{s.annualGrade}</td>
              </tr>
            ))}
            <tr className="bg-gray-200 font-bold">
              <td className="border border-black px-1">Total / Percentage</td>
              <td className="border border-black" colSpan={3} />
              {summary.map((t, i) => (
                <Fragment key={i}>
                  <td className="border border-black" colSpan={2} />
                  <td className="border border-black text-center">{fmt(t.total)}</td>
                  <td className="border border-black text-center" colSpan={2}>{fmt(t.percent)}%</td>
                </Fragment>
              ))}
              <td className="border border-black text-center">{fmt(data.annualTotal)}</td>
              <td className="border border-black text-center">{fmt(data.annualMax)}</td>
              <td className="border border-black text-center" colSpan={2}>{fmt(data.annualPercent)}%</td>
            </tr>
            <tr>
              <td className="border border-black px-1 font-bold">Position</td>
              <td className="border border-black" colSpan={3} />
              {summary.map((t, i) => (
                <td key={i} className="border border-black text-center" colSpan={5}>
                  {t.position ? `${t.position} out of ${data.classSize || ''}` : ''}
                </td>
              ))}
              <td className="border border-black text-center" colSpan={4}>
                {data.annualPosition ? `${data.annualPosition} out of ${data.classSize || ''}` : ''}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-1 font-bold">Comment</td>
              <td className="border border-black" colSpan={3} />
              {summary.map((t, i) => (
                <td key={i} className="border border-black px-1" colSpan={5}>{t.comment || ''}</td>
              ))}
              <td className="border border-black" colSpan={4} />
            </tr>
            <tr>
              <td className="border border-black px-1">Class teacher's Signature</td>
              <td className="border border-black" colSpan={3} />
              {[0, 1, 2].map((i) => (
                <td key={i} className="border border-black h-8" colSpan={5}>
                  {clazz.classTeacherSignature && i === 0 ? (
                    <AuthImage path={clazz.classTeacherSignature} alt="" className="mx-auto h-8" />
                  ) : null}
                </td>
              ))}
              <td className="border border-black" colSpan={4} />
            </tr>
            <tr>
              <td className="border border-black px-1">Parent's Signature</td>
              <td className="border border-black" colSpan={3} />
              {[0, 1, 2].map((i) => <td key={i} className="border border-black h-8" colSpan={5} />)}
              <td className="border border-black" colSpan={4} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] gap-3">
        <div className="border border-black p-2">
          <p className="font-bold">GRADING</p>
          <p>A: 100-80 · B: 79-75 · C: 74-70 · D: 69-65 · E: 64-60 · S: 59-50 · F: 49-0</p>
          <p className="mt-2 font-bold">Abbreviations</p>
          <p>EU End of Unit · ET End of Term · GR Grade · TOT Total · MAX Maximum</p>
        </div>
        <div className="flex flex-col items-center justify-center border-2 border-black px-4 py-2">
          <p className="text-xs">DECISION</p>
          <p className="text-lg font-bold">{data.decision || '—'}</p>
        </div>
        <div className="border border-black p-2 text-center">
          <p>Headteacher: <b>{school.headTeacherName}</b></p>
          <div className="mt-2 flex items-end justify-center gap-3">
            {school.headSignaturePath && <AuthImage path={school.headSignaturePath} alt="" className="h-10" />}
            {school.stampPath && <AuthImage path={school.stampPath} alt="" className="h-12" />}
          </div>
          <p className="mt-1">Signature and Stamp</p>
          <div className="mt-2 flex justify-center">
            <QRCodeSVG value={`${window.location.origin}/verify/${data.verificationCode}`} size={64} />
          </div>
          <p className="mt-1">{student.uniqueId}</p>
        </div>
      </div>
    </div>
  )
}

function fmt(v) {
  if (v == null || v === '') return ''
  const n = Number(v)
  return Number.isInteger(n) ? n : n.toFixed(1)
}
