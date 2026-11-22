import { Link, useParams } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Lang } from '@gaabe/ui';
import { findWorksheet, worksheets } from '@gaabe/demo-data';
import { WorksheetPlayer } from '@gaabe/worksheets';

export function Worksheets() {
  const { worksheetId } = useParams();
  const ws = findWorksheet(worksheetId);

  if (worksheetId && !ws) {
    return (
      <div className="container page">
        <h1><T k="courses.notFound" /></h1>
        <Link className="btn" to="/worksheets"><T k="common.back" /></Link>
      </div>
    );
  }
  if (ws) {
    return (
      <div className="container page stack">
        <Link to="/worksheets">← <T k="worksheet.title" /></Link>
        <h1><Lang>{ws.title}</Lang></h1>
        <WorksheetPlayer worksheet={ws} />
      </div>
    );
  }
  return (
    <div className="container page stack">
      <h1><T k="worksheet.title" /></h1>
      <div className="grid">
        {worksheets.map((w) => (
          <Link key={w.id} to={`/worksheets/${w.id}`} className="card card-link">
            <h3><Lang>{w.title}</Lang></h3>
            <p className="muted">
              <T k="worksheet.questionCount" vars={{ n: w.questions.length }} />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
