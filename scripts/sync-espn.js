#!/usr/bin/env node
/**
 * sync-espn.js — Extracts World Cup 2026 data from ESPN via espn-pp-cli
 * and generates clean JSON files for the website.
 *
 * Usage: node scripts/sync-espn.js
 * Requires: espn-pp-cli installed and on PATH
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');
const LOGOS_DIR = resolve(__dirname, '../public/logos');
const CLI = 'espn-pp-cli';

function run(args) {
  try {
    const result = execFileSync(CLI, [...args.split(' '), '--agent'], {
      encoding: 'utf-8',
      timeout: 60000
    });
    return JSON.parse(result);
  } catch (err) {
    console.error(`Failed: ${CLI} ${args}`);
    console.error(err.message);
    process.exit(1);
  }
}

// Ensure directories exist
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(LOGOS_DIR, { recursive: true });

console.log('=== Mundial 2026 — ESPN Data Sync ===\n');

// 1. Teams
console.log('1. Fetching teams...');
const teamsRaw = run('teams list soccer fifa.world');
const teamsMap = {};
const teamsList = teamsRaw.results.sports[0].leagues[0].teams;
for (const t of teamsList) {
  const team = t.team;
  const code = team.abbreviation.toLowerCase();
  teamsMap[code] = {
    id: team.id,
    name: team.displayName,
    abbreviation: team.abbreviation,
    slug: team.slug || code,
    color: team.color || '333333',
    alternateColor: team.alternateColor || 'ffffff',
    logo: `/logos/${code}.png`,
    logoEspn: `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`
  };
}
writeFileSync(resolve(DATA_DIR, 'teams.json'), JSON.stringify(Object.values(teamsMap), null, 2));
console.log(`   Saved ${Object.keys(teamsMap).length} teams`);

// 2. Groups + Standings
console.log('2. Fetching groups & standings...');
const standingsRaw = run('standings soccer fifa.world');
const groups = [];
for (const g of standingsRaw.children) {
  const groupName = g.name;
  const groupId = groupName.split(' ').pop();
  const entries = g.standings.entries;
  const groupTeams = entries.map(entry => {
    const team = entry.team;
    const abbr = team.abbreviation.toLowerCase();
    const stats = {};
    for (const s of entry.stats) {
      stats[s.name] = s.displayValue;
    }
    return {
      name: team.displayName,
      abbreviation: team.abbreviation,
      logo: `/logos/${abbr}.png`,
      espnId: team.id,
      stats: {
        rank: stats.rank || '0',
        gamesPlayed: stats.gamesPlayed || '0',
        wins: stats.wins || '0',
        ties: stats.ties || '0',
        losses: stats.losses || '0',
        goalsFor: stats.pointsFor || '0',
        goalsAgainst: stats.pointsAgainst || '0',
        goalDifference: stats.pointDifferential || '0',
        points: stats.points || '0'
      }
    };
  });
  groups.push({ id: groupId, name: `GRUPO ${groupId}`, teams: groupTeams });
}
writeFileSync(resolve(DATA_DIR, 'groups.json'), JSON.stringify(groups, null, 2));
console.log(`   Saved ${groups.length} groups`);

// 3. Matches
console.log('3. Fetching matches (Jun 11 - Jul 19)...');
const matchesRaw = run('scoreboard soccer fifa.world --dates 20260611-20260719');
const events = matchesRaw.results.events;
const matches = events.map(e => {
  const comp = e.competitions[0];
  const competitors = comp.competitors;
  const home = competitors.find(c => c.homeAway === 'home') || {};
  const away = competitors.find(c => c.homeAway === 'away') || {};
  const homeTeam = home.team || {};
  const awayTeam = away.team || {};

  const broadcasts = [];
  for (const b of (comp.broadcasts || [])) {
    broadcasts.push(...(b.names || []));
  }

  const venue = comp.venue || {};

  let group = '';
  const homeAbbr = homeTeam.abbreviation;
  for (const g of groups) {
    if (g.teams.some(t => t.abbreviation === homeAbbr)) {
      group = g.id;
      break;
    }
  }

  return {
    id: e.id,
    group,
    date: (e.date || '').slice(0, 10),
    time: e.date,
    status: (comp.status?.type?.name || 'scheduled'),
    statusDetail: (comp.status?.type?.detail || ''),
    homeTeam: {
      name: homeTeam.displayName,
      abbreviation: homeTeam.abbreviation,
      logo: `/logos/${(homeTeam.abbreviation || '').toLowerCase()}.png`,
      score: home.score || '0',
      espnId: homeTeam.id
    },
    awayTeam: {
      name: awayTeam.displayName,
      abbreviation: awayTeam.abbreviation,
      logo: `/logos/${(awayTeam.abbreviation || '').toLowerCase()}.png`,
      score: away.score || '0',
      espnId: awayTeam.id
    },
    venue: {
      name: venue.fullName || '',
      city: venue.address?.city || '',
      capacity: venue.capacity || 0
    },
    broadcasts
  };
});
writeFileSync(resolve(DATA_DIR, 'matches.json'), JSON.stringify(matches, null, 2));
console.log(`   Saved ${matches.length} matches`);

// Summary
const dates = [...new Set(matches.map(m => m.date))].sort();
console.log(`\n   Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
console.log(`   Total match dates: ${dates.length}`);
console.log('\n=== Sync complete ===');
