"""Test minimal Plotly Dash"""
import dash
from dash import dcc, html
import plotly.graph_objects as go

app = dash.Dash(__name__)

fig = go.Figure()
fig.add_trace(go.Bar(x=['Jan','Fév','Mar','Avr'], y=[1000,2500,1800,3200],
    marker_color=['#2196f3','#00b894','#e67e22','#e74c3c'],
    text=['1k','2.5k','1.8k','3.2k'], textposition='outside'))
fig.update_layout(
    paper_bgcolor='white', plot_bgcolor='#f8fafc',
    height=300, margin=dict(l=40,r=20,t=40,b=40),
    title='TEST CA MENSUEL')

app.layout = html.Div([
    html.H2("Test Dashboard", style={'padding':'20px','fontFamily':'Arial'}),
    html.Div([
        dcc.Graph(figure=fig, style={'height':'300px','width':'100%'})
    ], style={'background':'white','padding':'20px','margin':'20px',
              'borderRadius':'10px','boxShadow':'0 2px 8px rgba(0,0,0,0.1)'})
], style={'background':'#f0f2f5','minHeight':'100vh'})

if __name__=='__main__':
    print("Test sur http://localhost:8051")
    app.run(debug=False, host='0.0.0.0', port=8051)