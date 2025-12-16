from typing import Dict, Any, Optional
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import io

class SmartChartGenerator:
    """
    Context-aware chart generator.
    Decides chart type based on data context (Comparison, Trend, Composition).
    """
    def __init__(self):
        sns.set_theme(style="white", font="sans-serif")
        self._setup_style()
    
    def _setup_style(self):
        plt.rcParams['axes.spines.top'] = False
        plt.rcParams['axes.spines.right'] = False
        plt.rcParams['axes.grid'] = True
        plt.rcParams['grid.alpha'] = 0.3

    def generate_chart(self, data: Dict[str, Any], context: str) -> Optional[io.BytesIO]:
        """
        Generates a chart. 
        context: 'dcf_waterfall', 'revenue_trend', 'comps_scatter'
        """
        plt.figure(figsize=(10, 6))
        buffer = io.BytesIO()
        
        try:
            if context == 'dcf_waterfall':
                self._generate_waterfall(data)
            elif context == 'revenue_trend':
                self._generate_line_chart(data)
            # Add more types...
            
            plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
            plt.close()
            buffer.seek(0)
            return buffer
        except Exception as e:
            print(f"Chart generation error: {e}")
            return None

    def _generate_waterfall(self, data: Dict[str, Any]):
        # Simplified bar for now
        labels = data.get('labels', [])
        values = data.get('values', [])
        colors = ['green' if v >= 0 else 'red' for v in values]
        sns.barplot(x=labels, y=values, palette=colors)
        plt.title("Valuation Bridge")
        plt.axhline(0, color='black')

    def _generate_line_chart(self, data: Dict[str, Any]):
        sns.lineplot(x=data['x'], y=data['y'], marker='o')
        plt.title("Financial Trends")
