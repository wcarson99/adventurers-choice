import React from 'react';
import type { StatRequirement } from '../../types/Encounter';
import { getStatAbbreviation } from '../../types/Encounter';
import { theme } from '../styles/theme';

interface StatRequirementsProps {
  requiredStats: StatRequirement[];
}

/**
 * Component to display stat requirements for encounters
 * Shows stat abbreviations with minimum values as badges
 */
export const StatRequirements: React.FC<StatRequirementsProps> = ({ requiredStats }) => {
  if (requiredStats.length === 0) {
    return <span style={{ fontStyle: 'italic', color: theme.colors.textSecondary }}>No stat requirements</span>;
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      alignItems: 'center'
    }}>
      {requiredStats.map((req, index) => (
        <span
          key={`${req.attribute}-${index}`}
          data-testid={`stat-badge-${req.attribute}-${req.minimum}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.75rem',
            backgroundColor: theme.colors.accent,
            color: theme.colors.background,
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
          title={`${getStatAbbreviation(req.attribute)}: Minimum ${req.minimum}`}
        >
          {getStatAbbreviation(req.attribute)} {req.minimum}+
        </span>
      ))}
    </div>
  );
};




