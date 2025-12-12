import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { AgendaAttributes, Paper, OutputSectionHeader } from '../types';
import { ORTHODOX_PROBLEMS } from '../constants';
import { getItemById } from '../utils/dataProcessing';

interface ContentRendererProps {
  attributes: AgendaAttributes;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ attributes }) => {
  
  const resolveSeeAlso = (id: string) => {
    const item = getItemById(id);
    return item ? item.name : id;
  };

  return (
    <div className="content-renderer">
      {attributes.one_sentence_summary && (
        <div className="content-section summary">
          <ReactMarkdown>{`*${attributes.one_sentence_summary}*`}</ReactMarkdown>
        </div>
      )}

      {attributes.theory_of_change && (
        <div className="content-section">
          <h3><span className="symbol">≈</span> Theory of Change</h3>
          <ReactMarkdown>{attributes.theory_of_change}</ReactMarkdown>
        </div>
      )}

      <div className="content-section meta-row">
        {attributes.broad_approach_text && (
          <div className="meta-item">
            <span className="symbol">⚙</span>
            <strong>General Approach:</strong>
            <ReactMarkdown>{attributes.broad_approach_text}</ReactMarkdown>
          </div>
        )}
        
        {attributes.target_case_text && (
          <div className="meta-item">
            <span className="symbol">◐</span>
            <strong>Target Case:</strong>
            <ReactMarkdown>{attributes.target_case_text}</ReactMarkdown>
          </div>
        )}
      </div>

      {attributes.orthodox_problems.length > 0 && (
        <div className="content-section">
          <h3><span className="symbol">⚠</span> Orthodox Problems</h3>
          <div className="meta-list">
            {attributes.orthodox_problems.map(probId => {
              const prob = ORTHODOX_PROBLEMS[probId];
              return prob ? (
                 <span key={probId} style={{ marginRight: '1em' }}>
                   <a href={prob.url} target="_blank" rel="noopener noreferrer">{prob.name}</a>
                 </span>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Other Attributes */}
      {Object.entries(attributes.other_attributes).length > 0 && (
        <div className="content-section">
           {Object.entries(attributes.other_attributes).map(([key, value]) => (
             <div key={key} className="meta-item">
               <span className="symbol">○</span>
               <strong>{key}:</strong> {String(value)}
             </div>
           ))}
        </div>
      )}

      {attributes.see_also.length > 0 && (
        <div className="content-section">
          <h3><span className="symbol">↔</span> See Also</h3>
          <div className="see-also-list">
            {attributes.see_also.map((refId, idx) => (
              <span key={refId}>
                {idx > 0 && ' · '}
                <a href={`#${refId}`}>{resolveSeeAlso(refId)}</a>
              </span>
            ))}
          </div>
        </div>
      )}

      {attributes.some_names.length > 0 && (
        <div className="content-section">
          <h3><span className="symbol">☉</span> Key People</h3>
          <p>{attributes.some_names.join(', ')}</p>
        </div>
      )}

      {attributes.critiques && (
        <div className="content-section">
          <h3><span className="symbol">✗</span> Critiques</h3>
          <ReactMarkdown>{attributes.critiques}</ReactMarkdown>
        </div>
      )}

      <div className="content-section meta-row">
        {attributes.funded_by && (
          <div className="meta-item">
            <span className="symbol">*$</span>
            <strong>Funded By:</strong>
            <ReactMarkdown>{attributes.funded_by}</ReactMarkdown>
          </div>
        )}
        
        {attributes.estimated_ftes && (
          <div className="meta-item">
            <span className="symbol">*⫼</span>
            <strong>Estimated FTEs:</strong> {attributes.estimated_ftes}
          </div>
        )}
      </div>

      {attributes.outputs.length > 0 && (
        <div className="content-section outputs">
          <h3><span className="symbol">▹</span> Outputs</h3>
          <ul>
            {attributes.outputs.map((output, idx) => {
              // Check if it's a Section Header (duck typing)
              if ('section_name' in output) {
                return <h4 key={idx} style={{marginTop: '1em'}}>{(output as OutputSectionHeader).section_name}</h4>;
              }
              
              const paper = output as Paper;
              return (
                <li key={idx}>
                  {paper.link_url ? (
                    <a href={paper.link_url} target="_blank" rel="noopener noreferrer">
                      {paper.link_text || paper.title || paper.link_url}
                    </a>
                  ) : (
                    <ReactMarkdown>{paper.original_md}</ReactMarkdown>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

