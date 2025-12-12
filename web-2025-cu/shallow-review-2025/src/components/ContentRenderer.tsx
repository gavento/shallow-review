import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { AgendaAttributes, Paper, OutputSectionHeader } from '../types';
import { ORTHODOX_PROBLEMS } from '../constants';
import { getItemById } from '../utils/dataProcessing';

interface ContentRendererProps {
  attributes: AgendaAttributes;
}

const ICONS: Record<string, string> = {
  theory_of_change: '≈',
  broad_approach: '⚙',
  target_case: '◐',
  orthodox_problems: '⚠',
  see_also: '↔',
  some_names: '☉',
  critiques: '✗',
  funded_by: '$',
  estimated_ftes: '⫼',
  outputs: '▹',
  default: '○'
};

const Attribute = ({ label, icon, children }: { label: string, icon: string, children: React.ReactNode }) => (
  <div className="attribute-block">
    <div className="icon-col">{icon}</div>
    <div className="content-col">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{children}</span>
    </div>
  </div>
);

const MarkdownInline = ({ children }: { children: string }) => (
  <ReactMarkdown components={{ p: 'span' }}>{children}</ReactMarkdown>
);

export const ContentRenderer: React.FC<ContentRendererProps> = ({ attributes }) => {
  
  return (
    <div className="content-renderer">
      {attributes.one_sentence_summary && (
        <div className="content-section summary">
          <ReactMarkdown>{`*${attributes.one_sentence_summary}*`}</ReactMarkdown>
        </div>
      )}

      {attributes.theory_of_change && (
        <div className="content-section">
          <Attribute label="Theory of Change:" icon={ICONS.theory_of_change}>
             <MarkdownInline>{attributes.theory_of_change}</MarkdownInline>
          </Attribute>
        </div>
      )}

      <div className="content-section">
        {attributes.broad_approach_text && attributes.broad_approach_id && (
          <Attribute label="General Approach:" icon={ICONS.broad_approach}>
            <a href={`#def:approach:${attributes.broad_approach_id}`}>
              <MarkdownInline>{attributes.broad_approach_text}</MarkdownInline>
            </a>
          </Attribute>
        )}
        {attributes.broad_approach_text && !attributes.broad_approach_id && (
          <Attribute label="General Approach:" icon={ICONS.broad_approach}>
            <MarkdownInline>{attributes.broad_approach_text}</MarkdownInline>
          </Attribute>
        )}
        
        {attributes.target_case_text && attributes.target_case_id && (
          <Attribute label="Target Case:" icon={ICONS.target_case}>
            <a href={`#def:case:${attributes.target_case_id}`}>
              <MarkdownInline>{attributes.target_case_text}</MarkdownInline>
            </a>
          </Attribute>
        )}
        {attributes.target_case_text && !attributes.target_case_id && (
          <Attribute label="Target Case:" icon={ICONS.target_case}>
            <MarkdownInline>{attributes.target_case_text}</MarkdownInline>
          </Attribute>
        )}
      </div>

      {attributes.orthodox_problems.length > 0 && (
        <div className="content-section">
          <Attribute label="Orthodox Problems:" icon={ICONS.orthodox_problems}>
            {attributes.orthodox_problems.map((probId, idx) => {
              const prob = ORTHODOX_PROBLEMS[probId];
              return (
                 <span key={probId}>
                   {idx > 0 && ', '}
                   {prob ? (
                       <a href={`#def:problem:${probId}`}>{prob.name}</a>
                   ) : (
                       <MarkdownInline>{probId}</MarkdownInline>
                   )}
                 </span>
              );
            })}
          </Attribute>
        </div>
      )}

      {/* Other Attributes */}
      {Object.entries(attributes.other_attributes).length > 0 && (
        <div className="content-section">
           {Object.entries(attributes.other_attributes).map(([key, value]) => (
             <Attribute key={key} label={`${key}:`} icon={ICONS.default}>
               <MarkdownInline>{String(value)}</MarkdownInline>
             </Attribute>
           ))}
        </div>
      )}

      {attributes.see_also.length > 0 && (
        <div className="content-section">
          <Attribute label="See Also:" icon={ICONS.see_also}>
            {attributes.see_also.map((refId, idx) => {
                const item = getItemById(refId);
                return (
                  <span key={refId}>
                    {idx > 0 && ' · '}
                    {item ? (
                        <a href={`#${item.id}`}>
                            <MarkdownInline>{item.name}</MarkdownInline>
                        </a>
                    ) : (
                        <MarkdownInline>{refId}</MarkdownInline>
                    )}
                  </span>
                );
            })}
          </Attribute>
        </div>
      )}

      {attributes.some_names.length > 0 && (
        <div className="content-section">
          <Attribute label="Key People:" icon={ICONS.some_names}>
            {attributes.some_names.join(', ')}
          </Attribute>
        </div>
      )}

      {attributes.critiques && (
        <div className="content-section">
          <Attribute label="Critiques:" icon={ICONS.critiques}>
            <MarkdownInline>{attributes.critiques}</MarkdownInline>
          </Attribute>
        </div>
      )}

      <div className="content-section">
        {attributes.funded_by && (
          <Attribute label="Funded By:" icon={ICONS.funded_by}>
            <MarkdownInline>{attributes.funded_by}</MarkdownInline>
          </Attribute>
        )}
        
        {attributes.estimated_ftes && (
          <Attribute label="Estimated FTEs:" icon={ICONS.estimated_ftes}>
            {attributes.estimated_ftes}
          </Attribute>
        )}
      </div>

      {attributes.outputs.length > 0 && (
        <div className="content-section outputs">
          <Attribute label="Outputs:" icon={ICONS.outputs}>
            <ul className="paper-list" style={{ marginTop: '0.2rem' }}>
              {attributes.outputs.map((output, idx) => {
                if ('section_name' in output) {
                  return <h4 key={idx} style={{marginTop: '1em', fontWeight: 'bold'}}>{(output as OutputSectionHeader).section_name}</h4>;
                }
                
                const paper = output as Paper;
                return (
                  <li key={idx}>
                    {paper.link_url ? (
                      <>
                          <a href={paper.link_url} target="_blank" rel="noopener noreferrer">
                            <MarkdownInline>{paper.link_text || paper.title || paper.link_url}</MarkdownInline>
                          </a>
                          {paper.authors && paper.authors.length > 0 && (
                              <span className="paper-authors"> {paper.authors.join(', ')}</span>
                          )}
                      </>
                    ) : (
                      <ReactMarkdown>{paper.original_md}</ReactMarkdown>
                    )}
                  </li>
                );
              })}
            </ul>
          </Attribute>
        </div>
      )}
    </div>
  );
};
