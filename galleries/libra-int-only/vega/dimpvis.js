
var spec = {
    "data": [
      {
        "name": "country_timeline",
        "source": "gapminder",
        "transform": [
          {"type": "filter", "expr": "timeline && datum.country == timeline.country"},
          {"type": "collect", "sort": {"field": "year"}}
        ]
      },
      {
        "name": "thisYear",
        "source": "gapminder",
        "transform": [
          {"type": "filter", "expr": "datum.year == currentYear"}
        ]
      },
      {
        "name": "prevYear",
        "source": "gapminder",
        "transform": [
          {"type": "filter", "expr": "datum.year == currentYear - stepYear"}
        ]
      },
      {
        "name": "nextYear",
        "source": "gapminder",
        "transform": [
          {"type": "filter", "expr": "datum.year == currentYear + stepYear"}
        ]
      },
      {
        "name": "interpolate",
        "source": "countries",
        "transform": [
          {
            "type": "lookup",
            "from": "thisYear", "key": "country",
            "fields": ["country"], "as": ["this"],
            "default": {}
          },
          {
            "type": "lookup",
            "from": "prevYear", "key": "country",
            "fields": ["country"], "as": ["prev"],
            "default": {}
          },
          {
            "type": "lookup",
            "from": "nextYear", "key": "country",
            "fields": ["country"], "as": ["next"],
            "default": {}
          },
          {
            "type": "formula",
            "as": "target_fertility",
            "expr": "interYear > currentYear ? datum.next.fertility : (datum.prev.fertility||datum.this.fertility)"
          },
          {
            "type": "formula",
            "as": "target_life_expect",
            "expr": "interYear > currentYear ? datum.next.life_expect : (datum.prev.life_expect||datum.this.life_expect)"
          },
          {
            "type": "formula",
            "as": "inter_fertility",
            "expr": "interYear==2000 ? datum.this.fertility : datum.this.fertility + (datum.target_fertility-datum.this.fertility) * abs(interYear-datum.this.year)/5"
          },
          {
            "type": "formula",
            "as": "inter_life_expect",
            "expr": "interYear==2000 ? datum.this.life_expect : datum.this.life_expect + (datum.target_life_expect-datum.this.life_expect) * abs(interYear-datum.this.year)/5"
          }
        ]
      }
    ],
  
    "signals": [
      { "name": "minYear", "value": 1955 },
      { "name": "maxYear", "value": 2005 },
      { "name": "stepYear", "value": 5 },
      {
        "name": "active",
        "value": {},
        "on": [
          {"events": "@point:pointerdown, @point:touchstart", "update": "datum"},
          {"events": "window:pointerup, window:touchend", "update": "{}"}
        ]
      },
      { "name": "isActive", "update": "active.country" },
      {
        "name": "timeline",
        "value": {},
        "on": [
          {"events": "@point:pointerover", "update": "isActive ? active : datum"},
          {"events": "@point:pointerout", "update": "active"},
          {"events": {"signal": "active"}, "update": "active"}
        ]
      },
      {
        "name": "tX",
        "on": [{
          "events": "pointermove!, touchmove!",
          "update": "isActive ? scale('x', active.this.fertility) : tX"
        }]
      },
      {
        "name": "tY",
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? scale('y', active.this.life_expect) : tY"
        }]
      },
      {
        "name": "pX",
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? scale('x', active.prev.fertility) : pX"
        }]
      },
      {
        "name": "pY",
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? scale('y', active.prev.life_expect) : pY"
        }]
      },
      {
        "name": "nX",
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? scale('x', active.next.fertility) : nX"
        }]
      },
      {
        "name": "nY",
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? scale('y', active.next.life_expect) : nY"
        }]
      },
      {
        "name": "thisDist",
        "value": 0,
        "on":[{
          "events": "pointermove, touchmove",
          "update": "isActive ? hypot(x()-tX, y()-tY) : thisDist"
        }]
      },
      {
        "name": "prevDist",
        "value": 0,
        "on":[{
          "events": "pointermove, touchmove",
          "update": "isActive ? hypot(x()-pX, y()-pY): prevDist"
        }]
      },
      {
        "name": "nextDist",
        "value": 0,
        "on":[{
          "events": "pointermove, touchmove",
          "update": "isActive ? hypot(x()-nX, y()-nY) : nextDist"
        }]
      },
      {
        "name": "prevScore",
        "value": 0,
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? ((pX-tX) * (x()-tX) + (pY-tY) * (y()-tY))/prevDist || -999999 : prevScore"
        }]
      },
      {
        "name": "nextScore",
        "value": 0,
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? ((nX-tX) * (x()-tX) + (nY-tY) * (y()-tY))/nextDist || -999999 : nextScore"
        }]
      },
      {
        "name": "interYear",
        "value": 1980,
        "on": [{
          "events": "pointermove, touchmove",
          "update": "isActive ? (min(maxYear, currentYear+5, max(minYear, currentYear-5, prevScore > nextScore ? (currentYear - 2.5*prevScore/hypot(pX-tX, pY-tY)) : (currentYear + 2.5*nextScore/hypot(nX-tX, nY-tY))))) : interYear"
        }]
      },
      {
        "name": "currentYear",
        "value": 1980,
        "on":[{
          "events": "pointermove, touchmove",
          "update": "isActive ? (min(maxYear, max(minYear, prevScore > nextScore ? (thisDist < prevDist ? currentYear : currentYear-5) : (thisDist < nextDist ? currentYear : currentYear+5)))) : currentYear"
        }]
      }
    ],
  
    "marks": [
      {
        "type": "text",
        "encode": {
          "update": {
            "text": {"signal": "currentYear"},
          }
        }
      },
      {
        "name": "point",
        "encode": {
          "update": {
            "fillOpacity": [
              {
                "test": "datum.country==timeline.country || indata('trackCountries', 'country', datum.country)",
                "value": 1
              },
              {"value": 0.5}
            ]
          }
        }
      },
      {
        "type": "text",
        "encode": {
          "update": {
            "fillOpacity": [
              {
                "test": "datum.country==timeline.country || indata('trackCountries', 'country', datum.country)",
                "value": 0.8
              },
              {"value": 0}
            ]
          }
        }
      }
    ]
  }
  